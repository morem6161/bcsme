# BCSME Membership System - Quick Start Guide

## 🚀 You're Ready to Go!

Your complete membership management system has been built and tested. Here's what you have:

## ✅ What's Included

- **Public membership application form** with digital signature
- **Admin dashboard** with pending application queue
- **Board review list generator** (printable for meetings)
- **Member directory** with sponsor verification
- **PayPal payment integration** (currently in demo mode)
- **Secure authentication** and data storage

## 📦 Getting Started (Local Testing)

1. **Extract the files** from bcsme-membership-app folder

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   - Application form: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

5. **Login to admin:**
   - Username: `admin`
   - Password: `bcsme2025`
   - ⚠️ **IMPORTANT:** Change this password immediately!

## 🌐 Going Live (Deployment)

### Option 1: Quick Deploy to Render.com (Recommended for Getting Started)

1. Create free account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository OR upload files
4. Render auto-detects Node.js and deploys
5. Add environment variables in Render dashboard
6. Your app is live!

### Option 2: Deploy to Your Existing Host

If you have web hosting with Node.js support:

1. Upload files via FTP or cPanel
2. Run `npm install` on the server
3. Start with `node server.js` or use PM2
4. Point subdomain (members.bcsme.org) to the app
5. Set up SSL certificate (free with Let's Encrypt)

### Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

1. Get a VPS (~$5-10/month)
2. Install Node.js
3. Upload files and run `npm install`
4. Use PM2 to keep app running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name bcsme
   pm2 save
   pm2 startup
   ```
5. Configure nginx as reverse proxy
6. Add SSL certificate

## 🔧 Configuration

### Email Notifications (Optional)

Edit `.env` file:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=secretary@bcsme.org
```

For Gmail: Enable 2FA and create an "App Password"

### PayPal Integration (For Real Payments)

Currently in demo mode (auto-completes payment).

To enable real PayPal:
1. Get PayPal Business account
2. Edit `public/app.js`
3. Uncomment PayPal integration section (line ~190)
4. Add your PayPal credentials
5. Test in sandbox first, then switch to live

## 📋 First Steps After Deployment

1. **Login to admin dashboard**
2. **Change the default password**
3. **Add a test member** to the database (for sponsor verification testing)
4. **Submit a test application** to verify workflow
5. **Print the board review list** to test that feature
6. **Approve the test application**
7. **Verify the member appears in the directory**

## 🧪 Testing the Full Workflow

1. Go to http://your-domain.com
2. Fill out the membership form
   - Try different ages to see category auto-assignment
   - For Junior: Enter a sponsor name (won't verify until you add members)
   - Sign with your mouse
3. "Payment" will auto-complete (demo mode)
4. Login to admin dashboard
5. See the application in "Pending Applications"
6. Generate board review list
7. Approve the application
8. Check that member was added to directory

## 🔐 Security Checklist Before Going Live

- [ ] Change default admin password
- [ ] Set random SESSION_SECRET in .env
- [ ] Enable HTTPS/SSL
- [ ] Configure email notifications
- [ ] Test PayPal in sandbox mode
- [ ] Set up database backups
- [ ] Test all workflows end-to-end

## 📁 File Structure

```
bcsme-membership-app/
├── server.js              # Main server application
├── database.js            # Database management
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── public/                # Frontend files
│   ├── index.html         # Membership form
│   ├── admin.html         # Admin dashboard
│   ├── app.js             # Form functionality
│   ├── admin.js           # Dashboard functionality
│   ├── style.css          # Styles
│   └── signature_pad.min.js
└── bcsme_members.db       # Database (created on first run)
```

## 🆘 Troubleshooting

**Can't login?**
- Default: admin / bcsme2025
- Database file exists? Should see `bcsme_members.db`

**Sponsor verification failing?**
- Add members manually first in admin panel
- Names must match exactly

**Port 3000 already in use?**
- Change PORT in .env file
- Or: Stop other services using port 3000

**Email not sending?**
- Check .env EMAIL_* settings
- For Gmail: Use App Password, not regular password
- Currently optional - app works without email

## 📞 Support

For questions about the system:
- Email: secretary@bcsme.org
- Phone: (604) 291-0922

## 🎉 You're All Set!

Your membership system is complete and ready to deploy. The proof-of-concept is fully functional.

When you're ready for your New Year membership drive, just deploy to a hosting service and you're good to go!

---

**Need Help?** The full README-NODEJS.md file has detailed deployment instructions for every hosting option.
