const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('css'));
app.use(express.static('js'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bcsme-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true with HTTPS
}));

// Email configuration (optional for development)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('Email notifications enabled');
  } catch (err) {
    console.log('Email notifications disabled (not configured)');
  }
} else {
  console.log('Email notifications disabled (not configured)');
}

// Helper function to calculate membership fee
function calculateMembershipFee(category, birthdate) {
  const fees = {
    'regular': 50,
    'senior': 40,
    'associate': 30,
    'junior': 30,
    'probationary': 30
  };
  return fees[category] || 50;
}

// Helper function to determine membership category from age
function determineMembershipCategory(birthdate) {
  if (!birthdate) return null;
  
  const today = new Date();
  const birth = new Date(birthdate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 10) return null;
  if (age >= 10 && age <= 13) return 'probationary';
  if (age >= 14 && age <= 18) return 'junior';
  if (age >= 19 && age <= 64) return 'regular';
  if (age >= 65) return 'senior';
  
  return 'regular';
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Routes

// Serve main application form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Submit membership application
app.post('/api/application/submit', (req, res) => {
  const applicationData = req.body;
  
  // Calculate membership fee
  const category = applicationData.membership_category;
  const fee = calculateMembershipFee(category, applicationData.birthdate);
  applicationData.membership_fee = fee;
  
  // Verify sponsors if Junior member
  if (category === 'junior') {
    const sponsor1 = applicationData.junior_sponsor1;
    const sponsor2 = applicationData.junior_sponsor2;
    
    if (!sponsor1 || !sponsor2) {
      return res.status(400).json({ 
        error: 'Junior members must provide two sponsors' 
      });
    }
    
    // Verify both sponsors
    const result1 = db.verifySponsor(sponsor1);
    const result2 = db.verifySponsor(sponsor2);
    
    let sponsorIssues = [];
    if (!result1.isValid) sponsorIssues.push(`Sponsor 1 "${sponsor1}" not found in member database`);
    if (!result2.isValid) sponsorIssues.push(`Sponsor 2 "${sponsor2}" not found in member database`);
    
    applicationData.sponsor_issues = sponsorIssues.length > 0 ? sponsorIssues.join('; ') : null;
    
    // Create application
    try {
      const applicationId = db.createApplication(applicationData);
      
      // Send notification email if sponsor issues
      if (sponsorIssues.length > 0 && process.env.ADMIN_EMAIL) {
        sendSponsorIssueNotification(applicationId, applicationData);
      }
      
      res.json({
        success: true,
        applicationId: applicationId,
        fee: applicationData.membership_fee,
        hasSponsorIssues: sponsorIssues.length > 0
      });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  } else {
    // No sponsor verification needed
    try {
      const applicationId = db.createApplication(applicationData);
      
      res.json({
        success: true,
        applicationId: applicationId,
        fee: applicationData.membership_fee,
        hasSponsorIssues: false
      });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  }
});

// API: Confirm PayPal payment
app.post('/api/payment/confirm', (req, res) => {
  const { applicationId, paymentId, payerEmail } = req.body;
  
  const paymentData = {
    status: 'completed',
    payment_id: paymentId,
    payment_date: new Date().toISOString()
  };
  
  try {
    db.updateApplicationPayment(applicationId, paymentData);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// API: Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = db.getAdminUser(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    bcrypt.compare(password, user.password_hash, (err, result) => {
      if (result) {
        req.session.adminId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// API: Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// API: Check admin auth status
app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// API: Get all applications (admin only)
app.get('/api/admin/applications', requireAuth, (req, res) => {
  try {
    const applications = db.getAllApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Get pending applications (admin only)
app.get('/api/admin/applications/pending', requireAuth, (req, res) => {
  try {
    const applications = db.getPendingApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Approve/reject application (admin only)
app.post('/api/admin/applications/:id/approve', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  try {
    db.updateBoardApproval(id, status, notes);
    
    // If approved, add to members table
    if (status === 'approved') {
      const application = db.getApplicationById(id);
      if (application) {
        db.addMember({
          name: application.name,
          email: application.email,
          membership_type: application.membership_category
        });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Get all members (admin only)
app.get('/api/admin/members', requireAuth, (req, res) => {
  try {
    const members = db.getAllMembers();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Helper function to send sponsor issue notifications
function sendSponsorIssueNotification(applicationId, applicationData) {
  if (!transporter) {
    console.log('Email notifications disabled - sponsor issue for application', applicationId);
    return;
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'BCSME Membership: Sponsor Verification Issue',
    text: `
A new Junior membership application has been submitted but one or more sponsors could not be verified.

Application ID: ${applicationId}
Applicant Name: ${applicationData.name}
Email: ${applicationData.email}

Sponsor Issues:
${applicationData.sponsor_issues}

Please review this application in the admin dashboard.
    `
  };
  
  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error('Error sending notification email:', err);
    } else {
      console.log('Sponsor issue notification sent');
    }
  });
}

// Initialize default admin user if none exists
function initializeDefaultAdmin() {
  try {
    const user = db.getAdminUser('admin');
    if (!user) {
      const defaultPassword = 'bcsme2025';
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err);
          return;
        }
        try {
          db.createAdminUser('admin', hash, 'secretary@bcsme.org');
          console.log('Default admin user created:');
          console.log('Username: admin');
          console.log('Password: bcsme2025');
          console.log('PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');
        } catch (error) {
          console.error('Error creating admin user:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error checking admin user:', error);
  }
}

// Start server
async function startServer() {
  // Wait for database to be ready
  while (!db.ready) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  app.listen(PORT, () => {
    console.log(`BCSME Membership System running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
    console.log(`Admin dashboard at: http://localhost:${PORT}/admin`);
    initializeDefaultAdmin();
  });
}

startServer();
