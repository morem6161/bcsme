# BCSME Membership Management System

A complete web application for managing membership applications, payments, and approvals for the British Columbia Society of Model Engineers.

## Features

### Member-Facing Features
- ✅ Online membership application form
- ✅ Age-based automatic membership category calculation
- ✅ PayPal payment integration
- ✅ Digital signature collection
- ✅ Junior member sponsor verification
- ✅ Probationary member parent/guardian consent
- ✅ Privacy consent management

### Admin Features
- ✅ Secure admin login
- ✅ Pending applications dashboard
- ✅ Board review list generator (printable)
- ✅ Member directory (with privacy filtering)
- ✅ Sponsor verification system
- ✅ Approve/reject applications
- ✅ Payment tracking
- ✅ Email notifications for sponsor issues

## Technology Stack

- **Backend:** Python Flask
- **Database:** SQLite (upgradeable to PostgreSQL/MySQL)
- **Frontend:** HTML5, CSS3, JavaScript
- **Payment:** PayPal Business Integration
- **Security:** Werkzeug password hashing, Flask session management

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Web hosting account (optional, for deployment)

### Local Development Setup

1. **Download the application files**
   ```bash
   # Extract the provided files to a directory
   cd bcsme-membership
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the database**
   ```bash
   python app.py
   ```
   The database will be created automatically on first run.

4. **Create admin account**
   - Open your browser and go to: `http://localhost:5000/setup`
   - Fill in the admin account details
   - Click "Create Admin Account"

5. **Test the application**
   - Visit: `http://localhost:5000`
   - Test the membership application form
   - Login to admin at: `http://localhost:5000/admin/login`

## PayPal Integration Setup

To enable online payments, you need to configure PayPal:

1. **Create a PayPal Business Account**
   - Go to: https://www.paypal.com/ca/business
   - Sign up for a Business account

2. **Get your PayPal Client ID**
   - Log in to PayPal Developer Dashboard: https://developer.paypal.com/
   - Go to "Apps & Credentials"
   - Create a new app or use existing
   - Copy your "Client ID"

3. **Update the payment template**
   - Open: `templates/payment.html`
   - Find the line: `<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD"></script>`
   - Replace `YOUR_PAYPAL_CLIENT_ID` with your actual Client ID

4. **Test Mode**
   - PayPal Developer provides sandbox accounts for testing
   - Use sandbox credentials during development
   - Switch to live credentials for production

## Deployment Options

### Option 1: Heroku (Recommended for beginners)

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku app**
   ```bash
   heroku create bcsme-membership
   ```

3. **Add a Procfile**
   Create a file named `Procfile` (no extension):
   ```
   web: gunicorn app:app
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Setup database and admin**
   ```bash
   heroku open
   # Visit /setup to create admin account
   ```

### Option 2: PythonAnywhere (Free tier available)

1. **Sign up at:** https://www.pythonanywhere.com

2. **Upload files**
   - Use the Files tab to upload your application

3. **Create virtual environment**
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 bcsme
   pip install -r requirements.txt
   ```

4. **Configure Web App**
   - Go to Web tab
   - Add new web app
   - Choose Flask
   - Point to your app.py file

5. **Set working directory and static files**
   - Source code: `/home/yourusername/bcsme-membership`
   - Static files: `/static/` → `/home/yourusername/bcsme-membership/static/`

### Option 3: DigitalOcean/AWS/Your Own Server

1. **Install Python and dependencies**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip nginx
   ```

2. **Setup application**
   ```bash
   cd /var/www/bcsme-membership
   pip3 install -r requirements.txt
   ```

3. **Configure Nginx**
   Create `/etc/nginx/sites-available/bcsme`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /static {
           alias /var/www/bcsme-membership/static;
       }
   }
   ```

4. **Setup systemd service**
   Create `/etc/systemd/system/bcsme.service`:
   ```ini
   [Unit]
   Description=BCSME Membership System
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/bcsme-membership
   ExecStart=/usr/bin/python3 app.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start services**
   ```bash
   sudo systemctl enable bcsme
   sudo systemctl start bcsme
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## Connecting to Your Website

### Adding a Subdomain
1. Log in to your domain registrar or hosting control panel
2. Add an A record or CNAME:
   - Name: `membership` (creates membership.bcsme.org)
   - Points to: Your server IP address
3. Wait for DNS propagation (up to 24 hours)

### Adding a Link from Main Site
On your Joomla site, add a menu item or link:
```html
<a href="https://membership.bcsme.org">Member Application</a>
```

## Admin Usage Guide

### First-Time Setup
1. Visit `/setup` to create your admin account
2. Login at `/admin/login`
3. Familiarize yourself with the dashboard

### Managing Applications

#### Viewing Pending Applications
1. Login to admin dashboard
2. See all pending applications in the main table
3. Click "View Details" to see full application

#### Board Review Process
1. Click "Generate Board Review List"
2. Print or save as PDF for your meeting
3. After board approval, return to dashboard
4. Click "View Details" on each approved applicant
5. Click "Approve Member" button
6. Add any notes if needed

#### Handling Sponsor Issues
- Dashboard shows alerts for unverified sponsors
- Review each case manually
- Approve if sponsors are valid members
- Contact applicant if sponsors need correction

### Member Directory
- View all approved members who consented to directory
- Search and filter by category
- Export functionality available

## Security Best Practices

1. **Change default admin password immediately**
2. **Use HTTPS (SSL certificate)**
   - Let's Encrypt provides free SSL certificates
   - Most hosting providers offer easy SSL setup
3. **Regular backups**
   - Backup database file: `database/bcsme_members.db`
   - Backup regularly (weekly recommended)
4. **Keep dependencies updated**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

## Troubleshooting

### Database Issues
If database becomes corrupted:
```bash
# Backup old database
mv database/bcsme_members.db database/bcsme_members.db.backup

# Let Flask create new database
python app.py
```

### Payment Not Working
- Verify PayPal Client ID is correct
- Check browser console for JavaScript errors
- Ensure PayPal account is in good standing
- Test with PayPal Sandbox first

### Can't Login to Admin
If you forgot admin password:
```python
# Run Python shell
python3
>>> from app import db, Admin, app
>>> with app.app_context():
...     admin = Admin.query.first()
...     admin.set_password('newpassword')
...     db.session.commit()
```

### Sponsor Verification Not Working
- Ensure approved members exist in database
- Sponsor names must match exactly (case-insensitive)
- Check that sponsors have status='approved'

## Customization

### Changing Colors/Branding
Edit `static/css/style.css`:
```css
:root {
    --primary-color: #2c5f2d;  /* Change to your color */
    --primary-light: #97bf0d;
    /* etc. */
}
```

### Modifying Email Templates
Email notification code is in `app.py`:
- Search for functions related to sending emails
- Customize message content as needed

### Adding Fields
1. Update database model in `app.py`
2. Update application form in `templates/apply.html`
3. Update view templates to display new fields
4. Recreate database or use migrations

## Support & Maintenance

### Getting Help
- Check this README first
- Review Flask documentation: https://flask.palletsprojects.com/
- PayPal integration docs: https://developer.paypal.com/

### Regular Maintenance Tasks
- [ ] Weekly: Check for pending applications
- [ ] Monthly: Backup database
- [ ] Quarterly: Update dependencies
- [ ] Annually: Review and update membership fees

## License & Credits

Created for the British Columbia Society of Model Engineers
Built with Flask, SQLAlchemy, and modern web technologies

## Version History

**v1.0.0** (2025-10-14)
- Initial release
- Full membership application system
- PayPal integration
- Admin dashboard
- Board review functionality
- Sponsor verification system

---

**For questions or support, contact:** secretary@bcsme.org
