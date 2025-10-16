from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
from functools import wraps
import os
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/bcsme_members.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    birthdate = db.Column(db.Date, nullable=True)
    address = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    province_state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    preferred_contact = db.Column(db.String(50), nullable=True)
    phone_other = db.Column(db.String(50), nullable=True)
    
    # Membership details
    membership_category = db.Column(db.String(50), nullable=False)
    membership_fee = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    
    # Privacy
    directory_consent = db.Column(db.Boolean, default=False)
    
    # Areas of interest (stored as comma-separated values)
    interests = db.Column(db.Text, nullable=True)
    interests_other = db.Column(db.String(500), nullable=True)
    
    # Signatures and dates
    signature = db.Column(db.String(200), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    approval_date = db.Column(db.DateTime, nullable=True)
    
    # Payment
    payment_status = db.Column(db.String(50), default='pending')
    payment_id = db.Column(db.String(200), nullable=True)
    
    # For Junior/Probationary members
    parent_guardian_signature = db.Column(db.String(200), nullable=True)
    sponsor1_name = db.Column(db.String(200), nullable=True)
    sponsor1_status = db.Column(db.String(50), nullable=True)  # pending, approved, not_found
    sponsor2_name = db.Column(db.String(200), nullable=True)
    sponsor2_status = db.Column(db.String(50), nullable=True)
    
    # Notes for admin
    admin_notes = db.Column(db.Text, nullable=True)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Calculate membership category and fee based on age
def calculate_membership(birthdate_str):
    if not birthdate_str:
        return None, None
    
    birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    
    if age < 10:
        return None, None  # Too young
    elif age <= 13:
        return 'Probationary', 30.00
    elif age <= 18:
        return 'Junior', 30.00
    elif age <= 64:
        return 'Regular', 50.00
    else:
        return 'Senior', 40.00

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/apply', methods=['GET', 'POST'])
def apply():
    if request.method == 'POST':
        # Get form data
        name = request.form.get('name')
        email = request.form.get('email')
        birthdate_str = request.form.get('birthdate')
        address = request.form.get('address')
        city = request.form.get('city')
        province_state = request.form.get('province_state')
        postal_code = request.form.get('postal_code')
        preferred_contact = request.form.get('preferred_contact')
        phone_other = request.form.get('phone_other')
        directory_consent = request.form.get('directory_consent') == 'yes'
        signature = request.form.get('signature')
        
        # Areas of interest
        interests = request.form.getlist('interests')
        interests_other = request.form.get('interests_other')
        
        # Calculate membership category and fee
        category, fee = calculate_membership(birthdate_str)
        
        if not category:
            flash('Invalid age for membership. Please contact us at secretary@bcsme.org', 'error')
            return redirect(url_for('apply'))
        
        # Check for Junior/Probationary requirements
        sponsor1 = request.form.get('sponsor1')
        sponsor2 = request.form.get('sponsor2')
        parent_guardian = request.form.get('parent_guardian')
        
        # Validate sponsors for Junior members
        if category == 'Junior':
            if not sponsor1 or not sponsor2:
                flash('Junior members must provide two sponsors.', 'error')
                return redirect(url_for('apply'))
        
        # Validate parent/guardian for Probationary members
        if category == 'Probationary':
            if not parent_guardian:
                flash('Probationary members must provide parent/guardian signature.', 'error')
                return redirect(url_for('apply'))
        
        # Create new member
        try:
            birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date() if birthdate_str else None
            
            new_member = Member(
                name=name,
                email=email,
                birthdate=birthdate,
                address=address,
                city=city,
                province_state=province_state,
                postal_code=postal_code,
                preferred_contact=preferred_contact,
                phone_other=phone_other,
                membership_category=category,
                membership_fee=fee,
                directory_consent=directory_consent,
                interests=','.join(interests),
                interests_other=interests_other,
                signature=signature,
                parent_guardian_signature=parent_guardian,
                sponsor1_name=sponsor1,
                sponsor2_name=sponsor2
            )
            
            db.session.add(new_member)
            db.session.commit()
            
            # Check sponsors if Junior
            if category == 'Junior':
                check_sponsors(new_member.id)
            
            # Redirect to payment
            return redirect(url_for('payment', member_id=new_member.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error submitting application: {str(e)}', 'error')
            return redirect(url_for('apply'))
    
    return render_template('apply.html')

def check_sponsors(member_id):
    """Check if sponsors exist in member database"""
    member = Member.query.get(member_id)
    
    if member.sponsor1_name:
        sponsor1 = Member.query.filter_by(name=member.sponsor1_name, status='approved').first()
        if sponsor1:
            member.sponsor1_status = 'verified'
        else:
            member.sponsor1_status = 'not_found'
    
    if member.sponsor2_name:
        sponsor2 = Member.query.filter_by(name=member.sponsor2_name, status='approved').first()
        if sponsor2:
            member.sponsor2_status = 'verified'
        else:
            member.sponsor2_status = 'not_found'
    
    db.session.commit()

@app.route('/payment/<int:member_id>')
def payment(member_id):
    member = Member.query.get_or_404(member_id)
    return render_template('payment.html', member=member)

@app.route('/payment/success/<int:member_id>')
def payment_success(member_id):
    member = Member.query.get_or_404(member_id)
    payment_id = request.args.get('payment_id', 'PENDING')
    
    member.payment_status = 'completed'
    member.payment_id = payment_id
    db.session.commit()
    
    return render_template('payment_success.html', member=member)

# Admin Routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        admin = Admin.query.filter_by(username=username).first()
        
        if admin and admin.check_password(password):
            session['admin_id'] = admin.id
            session['admin_username'] = admin.username
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    pending = Member.query.filter_by(status='pending', payment_status='completed').all()
    approved = Member.query.filter_by(status='approved').all()
    rejected = Member.query.filter_by(status='rejected').all()
    
    # Check for sponsor issues
    sponsor_issues = Member.query.filter(
        (Member.sponsor1_status == 'not_found') | 
        (Member.sponsor2_status == 'not_found')
    ).all()
    
    return render_template('admin_dashboard.html', 
                         pending=pending, 
                         approved=approved,
                         rejected=rejected,
                         sponsor_issues=sponsor_issues)

@app.route('/admin/member/<int:member_id>')
@login_required
def view_member(member_id):
    member = Member.query.get_or_404(member_id)
    return render_template('view_member.html', member=member)

@app.route('/admin/approve/<int:member_id>', methods=['POST'])
@login_required
def approve_member(member_id):
    member = Member.query.get_or_404(member_id)
    member.status = 'approved'
    member.approval_date = datetime.utcnow()
    
    notes = request.form.get('notes')
    if notes:
        member.admin_notes = notes
    
    db.session.commit()
    flash(f'Member {member.name} approved!', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/reject/<int:member_id>', methods=['POST'])
@login_required
def reject_member(member_id):
    member = Member.query.get_or_404(member_id)
    member.status = 'rejected'
    
    notes = request.form.get('notes')
    if notes:
        member.admin_notes = notes
    
    db.session.commit()
    flash(f'Member {member.name} rejected.', 'warning')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/board-review')
@login_required
def board_review():
    """Generate a printable board review list"""
    pending = Member.query.filter_by(status='pending', payment_status='completed').order_by(Member.application_date).all()
    current_date = datetime.now().strftime('%B %d, %Y')
    return render_template('board_review.html', members=pending, current_date=current_date, now=datetime.now())

@app.route('/admin/directory')
@login_required
def member_directory():
    """View approved members with directory consent"""
    members = Member.query.filter_by(status='approved', directory_consent=True).order_by(Member.name).all()
    return render_template('directory.html', members=members)

# Initialize database and create admin user
@app.route('/setup', methods=['GET', 'POST'])
def setup():
    # Check if admin already exists
    if Admin.query.first():
        return "Setup already completed. Admin user exists."
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        
        admin = Admin(username=username, email=email)
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        
        flash('Admin account created! Please login.', 'success')
        return redirect(url_for('admin_login'))
    
    return render_template('setup.html')

if __name__ == '__main__':
    # Create database directory if it doesn't exist
    os.makedirs('database', exist_ok=True)
    
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
