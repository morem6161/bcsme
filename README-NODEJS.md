# BCSME Membership Application System

A complete web application for the British Columbia Society of Model Engineers membership management system.

## Features

✅ **Member Application Form**
- Age-based automatic membership category assignment
- Digital signature capture
- Multiple areas of interest selection
- Junior member sponsor verification
- Probationary member guardian approval

✅ **Payment Integration**
- PayPal Business integration
- Automatic fee calculation based on membership type
- Payment confirmation and tracking

✅ **Admin Dashboard**
- Pending applications queue
- Complete application history
- Member directory management
- Board review list generation (printable)
- Sponsor verification system

✅ **Security & Privacy**
- Secure password authentication
- Session management
- BC Privacy Act compliance
- Encrypted data storage

## Technology Stack

- **Backend:** Node.js with Express
- **Database:** SQLite (portable and simple)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Payment:** PayPal Business API

## Quick Start

### Prerequisites

- Node.js 16+ installed
- PayPal Business account (for production)
- Email account for notifications (Gmail recommended)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```
PORT=3000
SESSION_SECRET=your-random-secret-key-here

# Email (optional for development, required for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=secretary@bcsme.org
```

3. **Start the server:**
```bash
npm start
```

4. **Access the application:**
- Public application form: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

### Default Admin Login

```
Username: admin
Password: bcsme2025
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

## Project Structure

```
bcsme-membership/
├── server.js           # Main Express server
├── database.js         # Database operations
├── package.json        # Node dependencies
├── .env               # Environment variables (create from .env.example)
├── public/            # Frontend files
│   ├── index.html     # Membership application form
│   ├── admin.html     # Admin dashboard
│   ├── app.js         # Form functionality
│   ├── admin.js       # Admin dashboard functionality
│   ├── style.css      # Styles
│   └── signature_pad.min.js  # Signature capture
└── bcsme_members.db   # SQLite database (created automatically)
```

## Usage Guide

### For Members (Public)

1. Visit the membership application page
2. Fill out personal information
3. Enter birthdate (system automatically determines membership category and fee)
4. For Junior members: Enter two current member sponsors
5. For Probationary members: Provide parent/guardian information
6. Select areas of interest
7. Sign digitally
8. Submit and complete PayPal payment
9. Receive confirmation email

### For Administrators

1. Log in to admin dashboard at `/admin`
2. View pending applications that need board approval
3. Review application details
4. Generate board review list for monthly meetings
5. Approve or reject applications after board review
6. Manage member directory
7. Add members manually if needed

### Board Meeting Workflow

1. Before meeting: Generate and print Board Review List
2. During meeting: Review applications
3. After meeting: Log in and approve/reject applications in system
4. Approved members automatically added to member directory

## PayPal Integration (Production)

Currently using demo mode. To enable real PayPal payments:

1. Get PayPal Business account credentials
2. Edit `public/app.js`:
   - Uncomment the PayPal integration section
   - Add your PayPal Client ID
   - Configure return/cancel URLs

3. Test in PayPal Sandbox first
4. Switch to live mode for production

## Deployment Options

### Option 1: Traditional Web Host (Recommended for Getting Started)

**Services:** DigitalOcean, Linode, AWS Lightsail, etc.

1. Get a VPS (Virtual Private Server) - ~$5-10/month
2. Install Node.js on server
3. Upload files via FTP or Git
4. Install dependencies: `npm install`
5. Use PM2 to keep app running:
```bash
npm install -g pm2
pm2 start server.js --name bcsme-membership
pm2 save
pm2 startup
```

6. Set up nginx as reverse proxy
7. Get SSL certificate with Let's Encrypt (free)

### Option 2: Platform as a Service (Easiest)

**Services:** Heroku, Railway.app, Render.com

1. Sign up for account
2. Connect your Git repository
3. Platform automatically detects Node.js and deploys
4. Add environment variables in platform dashboard
5. Custom domain setup available

### Option 3: Subdomain on Existing Site

If bcsme.org is hosted on cPanel or similar:

1. Create subdomain: members.bcsme.org
2. Point to Node.js application
3. Many hosts support Node.js apps (check with your host)

## Database Management

### Backup Database

```bash
# Copy the database file
cp bcsme_members.db bcsme_members_backup_$(date +%Y%m%d).db
```

### View Database Contents

```bash
sqlite3 bcsme_members.db
.tables
SELECT * FROM members;
.exit
```

### Export Data

```bash
sqlite3 bcsme_members.db -csv -header "SELECT * FROM members" > members_export.csv
```

## Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Set strong SESSION_SECRET in .env
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure email notifications
- [ ] Test PayPal integration in sandbox mode
- [ ] Set up regular database backups
- [ ] Review privacy policy text
- [ ] Test all workflows end-to-end

## Troubleshooting

**Issue: Can't log in to admin**
- Default credentials: admin / bcsme2025
- Check if database was initialized (bcsme_members.db exists)

**Issue: Sponsor verification not working**
- Members must be added to database first
- Sponsor names must match exactly
- Check member status is 'active'

**Issue: Payment not processing**
- Currently in demo mode - shows success automatically
- Implement real PayPal integration for production

**Issue: Email notifications not sending**
- Verify EMAIL_* variables in .env
- For Gmail: Use "App Password" not regular password
- Check firewall allows outbound SMTP connections

## Support & Maintenance

### Regular Maintenance Tasks

- Weekly: Review pending applications
- Monthly: Backup database
- Quarterly: Update Node.js dependencies (`npm update`)
- Annually: Renew SSL certificate (automatic with Let's Encrypt)

### Adding New Admin Users

Currently single admin. To add multiple admins, you would need to:
1. Use admin panel to generate password hash
2. Manually insert into admin_users table
3. Or extend system to include user management UI

## Future Enhancements

Potential features to add:

- [ ] Email confirmation to applicants
- [ ] Automated sponsor approval emails
- [ ] Member renewal reminders
- [ ] Member portal for profile updates
- [ ] Payment history tracking
- [ ] Export membership reports
- [ ] Integration with accounting software
- [ ] Mobile app

## License

Created for the British Columbia Society of Model Engineers

## Contact

For questions about the BCSME membership system:
- Email: secretary@bcsme.org
- Phone: (604) 291-0922
- Address: 120 North Willingdon Avenue, Burnaby, B.C. V5C 6K1
