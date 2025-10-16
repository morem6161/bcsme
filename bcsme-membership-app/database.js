const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'bcsme_members.db');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.ready = false;
  }

  async init() {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      this.db = new SQL.Database(buffer);
      console.log('Loaded existing database');
    } else {
      this.db = new SQL.Database();
      console.log('Created new database');
    }
    
    this.initializeTables();
    this.ready = true;
    this.saveToFile();
  }

  initializeTables() {
    // Members table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        membership_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Applications table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        birthdate TEXT,
        address TEXT,
        city TEXT,
        province_state TEXT,
        postal_code TEXT,
        phone_other TEXT,
        preferred_contact TEXT,
        membership_category TEXT NOT NULL,
        membership_fee REAL NOT NULL,
        areas_of_interest TEXT,
        publish_in_directory INTEGER DEFAULT 0,
        signature_data TEXT,
        signature_date TEXT,
        payment_status TEXT DEFAULT 'pending',
        payment_id TEXT,
        payment_date TEXT,
        application_status TEXT DEFAULT 'pending',
        board_approval_status TEXT DEFAULT 'pending',
        board_approval_date TEXT,
        board_notes TEXT,
        junior_sponsor1 TEXT,
        junior_sponsor2 TEXT,
        junior_sponsor1_status TEXT,
        junior_sponsor2_status TEXT,
        probationary_guardian TEXT,
        probationary_guardian_status TEXT,
        sponsor_issues TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  }

  saveToFile() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  // Application methods
  createApplication(data) {
    const stmt = this.db.prepare(`
      INSERT INTO applications (
        name, email, birthdate, address, city, province_state, postal_code,
        phone_other, preferred_contact, membership_category, membership_fee,
        areas_of_interest, publish_in_directory, signature_data, signature_date,
        junior_sponsor1, junior_sponsor2, probationary_guardian
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.name, data.email, data.birthdate, data.address, data.city,
      data.province_state, data.postal_code, data.phone_other,
      data.preferred_contact, data.membership_category, data.membership_fee,
      data.areas_of_interest, data.publish_in_directory,
      data.signature_data, data.signature_date,
      data.junior_sponsor1, data.junior_sponsor2, data.probationary_guardian
    ]);

    const result = this.db.exec('SELECT last_insert_rowid()')[0];
    const applicationId = result.values[0][0];
    
    stmt.free();
    this.saveToFile();
    return applicationId;
  }

  updateApplicationPayment(applicationId, paymentData) {
    const stmt = this.db.prepare(`
      UPDATE applications 
      SET payment_status = ?, payment_id = ?, payment_date = ?, application_status = ?
      WHERE id = ?
    `);
    
    stmt.run([
      paymentData.status, paymentData.payment_id, paymentData.payment_date,
      'awaiting_approval', applicationId
    ]);
    
    stmt.free();
    this.saveToFile();
  }

  getApplicationById(id) {
    const stmt = this.db.prepare('SELECT * FROM applications WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  getAllApplications() {
    const results = this.db.exec('SELECT * FROM applications ORDER BY created_at DESC');
    if (results.length === 0) return [];
    return this.resultsToObjects(results[0]);
  }

  getPendingApplications() {
    const stmt = this.db.prepare(
      'SELECT * FROM applications WHERE board_approval_status = ? AND payment_status = ? ORDER BY created_at DESC'
    );
    stmt.bind(['pending', 'completed']);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  updateBoardApproval(applicationId, status, notes) {
    const stmt = this.db.prepare(`
      UPDATE applications 
      SET board_approval_status = ?, board_approval_date = CURRENT_TIMESTAMP, board_notes = ?
      WHERE id = ?
    `);
    stmt.run([status, notes, applicationId]);
    stmt.free();
    this.saveToFile();
  }

  // Member methods
  verifySponsor(name) {
    const stmt = this.db.prepare(
      'SELECT * FROM members WHERE name = ? AND status = ?'
    );
    stmt.bind([name, 'active']);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return { isValid: result ? true : false, member: result };
  }

  addMember(data) {
    const stmt = this.db.prepare(`
      INSERT INTO members (name, email, status, membership_type)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([data.name, data.email, 'active', data.membership_type]);
    stmt.free();
    this.saveToFile();
  }

  getAllMembers() {
    const stmt = this.db.prepare('SELECT * FROM members WHERE status = ? ORDER BY name');
    stmt.bind(['active']);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // Admin methods
  createAdminUser(username, passwordHash, email) {
    const stmt = this.db.prepare('INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)');
    stmt.run([username, passwordHash, email]);
    stmt.free();
    this.saveToFile();
  }

  getAdminUser(username) {
    const stmt = this.db.prepare('SELECT * FROM admin_users WHERE username = ?');
    stmt.bind([username]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  // Helper method to convert sql.js results to array of objects
  resultsToObjects(result) {
    const columns = result.columns;
    const values = result.values;
    return values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }

  close() {
    if (this.db) {
      this.saveToFile();
      this.db.close();
    }
  }
}

// Create and export a singleton instance
const dbManager = new DatabaseManager();

// Initialize the database asynchronously
dbManager.init().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = dbManager;
