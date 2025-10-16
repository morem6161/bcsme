# BCSME Membership System - Quick Start Guide

## What You Have
A complete, ready-to-deploy membership management web application specifically designed for the British Columbia Society of Model Engineers.

## Immediate Next Steps (5 minutes)

### Step 1: Extract the Files
1. Download the `bcsme-membership-app` folder
2. Extract to your computer

### Step 2: Install Python Dependencies
Open a terminal/command prompt in the extracted folder:
```bash
pip install -r requirements.txt
```

### Step 3: Run Locally
```bash
python app.py
```

### Step 4: Setup Admin Account
1. Open your browser
2. Go to: `http://localhost:5000/setup`
3. Create your admin username and password
4. Login at: `http://localhost:5000/admin/login`

### Step 5: Test the Application
1. Visit: `http://localhost:5000`
2. Try filling out a membership application
3. Check the admin dashboard to see it appear

## Configure PayPal (10 minutes)

1. **Get PayPal Client ID:**
   - Log into PayPal Developer: https://developer.paypal.com/
   - Create app or use existing
   - Copy your Client ID

2. **Update Payment Template:**
   - Open: `templates/payment.html`
   - Line 42: Replace `YOUR_PAYPAL_CLIENT_ID` with your actual ID
   - Save the file

3. **Test Payments:**
   - Use PayPal Sandbox for testing
   - Switch to live credentials when ready for production

## Deploy to Web (Choose One Option)

### Option A: PythonAnywhere (FREE - Recommended)
1. Sign up: https://www.pythonanywhere.com
2. Upload your files via Files tab
3. Create new Flask web app
4. Point to `app.py`
5. Done! Your site is live

### Option B: Heroku ($5-7/month)
1. Create account: https://heroku.com
2. Install Heroku CLI
3. Run:
```bash
heroku create bcsme-membership
git init
git add .
git commit -m "Initial"
git push heroku main
```

### Option C: Your Existing Hosting
If you have web hosting with Python support:
1. Upload files via FTP/SFTP
2. Install dependencies
3. Configure web server (Apache/Nginx)
4. See README.md for detailed instructions

## Connect to Your Website

### Add a Subdomain
1. In your domain control panel (where you manage bcsme.org)
2. Add A record: `membership` → points to your server IP
3. Access at: https://membership.bcsme.org

### Add a Link from Your Main Site
On your Joomla site, add:
```html
<a href="https://membership.bcsme.org">Apply for Membership</a>
```

## Key Features You Can Use Right Away

✅ **Member Applications** - At /apply
✅ **Admin Dashboard** - At /admin/login  
✅ **Board Review List** - Generate & print from dashboard
✅ **Member Directory** - View approved members
✅ **Sponsor Verification** - Automatic for Junior members
✅ **Payment Tracking** - See who paid, who didn't

## Important Files

- `app.py` - Main application (don't modify unless needed)
- `templates/` - HTML pages (customize look here)
- `static/css/style.css` - Styling (change colors here)
- `database/` - Member data (backup regularly!)
- `README.md` - Full documentation

## Customization Tips

### Change Colors
Edit `static/css/style.css`:
```css
:root {
    --primary-color: #2c5f2d;  /* Your club color */
}
```

### Update Contact Info
Edit `templates/base.html` footer section

### Modify Form Fields
Edit `templates/apply.html`

## Security Checklist

- [ ] Change admin password after first login
- [ ] Enable HTTPS/SSL on your hosting
- [ ] Backup database weekly
- [ ] Don't share admin credentials
- [ ] Keep dependencies updated

## Getting Help

1. **Read the Full README** - In the folder, detailed instructions
2. **Check Flask Docs** - https://flask.palletsprojects.com/
3. **PayPal Integration** - https://developer.paypal.com/

## Troubleshooting

**Can't start app?**
- Make sure Python 3.8+ is installed
- Run `pip install -r requirements.txt` again

**Database errors?**
- Delete `database/bcsme_members.db`
- Restart app (creates fresh database)

**Forgot admin password?**
- Delete database and run `/setup` again
- Or see README.md for password reset code

## What Happens Next?

1. Members apply online → Pay via PayPal
2. You see applications in admin dashboard
3. Print Board Review List for meetings
4. Approve/reject from dashboard
5. Approved members get email confirmation
6. View all members in directory

## Your Workflow

**Monthly:**
1. Login to admin
2. Click "Generate Board Review List"
3. Print for board meeting
4. After meeting, approve/reject each application
5. System sends confirmation emails

**As Needed:**
- Check for sponsor verification issues
- View member directory
- Export member lists
- Manage applications

---

**You're all set!** Start with running locally, then deploy when ready.

For detailed documentation, see README.md

**Support:** secretary@bcsme.org
