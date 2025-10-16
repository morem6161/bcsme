// Main application JavaScript for BCSME Membership Form

// Initialize signature pad
const canvas = document.getElementById('signaturePad');
const signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)'
});

// Clear signature button
document.getElementById('clearSignature').addEventListener('click', () => {
    signaturePad.clear();
});

// Resize canvas for different screen sizes
function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const container = canvas.parentElement;
    canvas.width = Math.min(600, container.clientWidth - 20) * ratio;
    canvas.height = 200 * ratio;
    canvas.style.width = `${canvas.width / ratio}px`;
    canvas.style.height = `${canvas.height / ratio}px`;
    canvas.getContext('2d').scale(ratio, ratio);
    signaturePad.clear();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Calculate age from birthdate
function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Determine membership category and fee
function determineMembershipCategory(birthdate) {
    const age = calculateAge(birthdate);
    
    if (age < 10) {
        return { category: null, fee: 0, description: 'Must be at least 10 years old to join' };
    } else if (age >= 10 && age <= 13) {
        return { 
            category: 'probationary', 
            fee: 30, 
            description: 'Probationary Member (10-13 years)',
            requiresGuardian: true
        };
    } else if (age >= 14 && age <= 18) {
        return { 
            category: 'junior', 
            fee: 30, 
            description: 'Junior Member (14-18 years)',
            requiresSponsors: true
        };
    } else if (age >= 19 && age <= 64) {
        return { 
            category: 'regular', 
            fee: 50, 
            description: 'Regular Member (19-64 years)'
        };
    } else if (age >= 65) {
        return { 
            category: 'senior', 
            fee: 40, 
            description: 'Senior Member (65+ years)'
        };
    }
    
    return { category: 'regular', fee: 50, description: 'Regular Member' };
}

// Update membership category display
document.getElementById('birthdate').addEventListener('change', function() {
    const birthdate = this.value;
    const categoryInfo = determineMembershipCategory(birthdate);
    const displayBox = document.getElementById('membershipCategoryDisplay');
    
    if (!categoryInfo.category) {
        displayBox.innerHTML = `<p style="color: #dc3545;">${categoryInfo.description}</p>`;
        displayBox.classList.remove('active');
        document.getElementById('membership_category').value = '';
        document.getElementById('membership_fee').value = '';
        return;
    }
    
    displayBox.classList.add('active');
    displayBox.innerHTML = `
        <h3>${categoryInfo.description}</h3>
        <div class="fee">$${categoryInfo.fee}/year</div>
    `;
    
    document.getElementById('membership_category').value = categoryInfo.category;
    document.getElementById('membership_fee').value = categoryInfo.fee;
    
    // Show/hide conditional sections
    const juniorSection = document.getElementById('juniorSection');
    const probationarySection = document.getElementById('probationarySection');
    
    if (categoryInfo.requiresSponsors) {
        juniorSection.style.display = 'block';
        probationarySection.style.display = 'none';
        document.getElementById('junior_sponsor1').required = true;
        document.getElementById('junior_sponsor2').required = true;
        document.getElementById('probationary_guardian').required = false;
    } else if (categoryInfo.requiresGuardian) {
        juniorSection.style.display = 'none';
        probationarySection.style.display = 'block';
        document.getElementById('junior_sponsor1').required = false;
        document.getElementById('junior_sponsor2').required = false;
        document.getElementById('probationary_guardian').required = true;
    } else {
        juniorSection.style.display = 'none';
        probationarySection.style.display = 'none';
        document.getElementById('junior_sponsor1').required = false;
        document.getElementById('junior_sponsor2').required = false;
        document.getElementById('probationary_guardian').required = false;
    }
});

// Form submission
document.getElementById('membershipForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate signature
    if (signaturePad.isEmpty()) {
        alert('Please provide your signature before submitting.');
        return;
    }
    
    // Validate membership category is selected
    const category = document.getElementById('membership_category').value;
    if (!category) {
        alert('Please enter your birthdate to determine your membership category.');
        return;
    }
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        birthdate: document.getElementById('birthdate').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        province_state: document.getElementById('province_state').value,
        postal_code: document.getElementById('postal_code').value,
        phone_other: document.getElementById('phone_other').value,
        preferred_contact: document.getElementById('preferred_contact').value,
        membership_category: category,
        membership_fee: document.getElementById('membership_fee').value,
        publish_in_directory: document.getElementById('publish_in_directory').checked ? 1 : 0,
        signature_data: signaturePad.toDataURL(),
        signature_date: new Date().toISOString(),
        junior_sponsor1: document.getElementById('junior_sponsor1').value,
        junior_sponsor2: document.getElementById('junior_sponsor2').value,
        probationary_guardian: document.getElementById('probationary_guardian').value
    };
    
    // Collect areas of interest
    const interests = Array.from(document.querySelectorAll('input[name="interest"]:checked'))
        .map(cb => cb.value);
    const otherInterest = document.getElementById('other_interest').value;
    if (otherInterest) {
        interests.push(`Other: ${otherInterest}`);
    }
    formData.areas_of_interest = interests.join(', ');
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Submit application
        const response = await fetch('/api/application/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Redirect to PayPal for payment
            redirectToPayPal(result.applicationId, result.fee, formData.name, formData.email);
        } else {
            alert('Error submitting application: ' + (result.error || 'Unknown error'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application & Pay Membership Fee';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting application. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application & Pay Membership Fee';
    }
});

// Redirect to PayPal (for now, show success - you'll add real PayPal integration)
function redirectToPayPal(applicationId, amount, name, email) {
    // For this proof of concept, we'll simulate payment success
    // In production, you would redirect to PayPal here
    
    // Simulate payment confirmation
    setTimeout(async () => {
        await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                applicationId: applicationId,
                paymentId: 'DEMO-' + Date.now(),
                payerEmail: email
            })
        });
        
        // Show success message
        document.getElementById('membershipForm').style.display = 'none';
        const successMsg = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        
        successText.innerHTML = `
            <p><strong>Thank you, ${name}!</strong></p>
            <p>Your membership application has been submitted and payment of $${amount} has been received.</p>
            <p>Your application will be reviewed by the Board at the next monthly meeting.</p>
            <p>You will receive an email confirmation shortly at <strong>${email}</strong></p>
            <p style="margin-top: 20px;">Application ID: <strong>${applicationId}</strong></p>
        `;
        
        successMsg.style.display = 'block';
        window.scrollTo(0, 0);
    }, 1000);
    
    /* PRODUCTION PayPal CODE (uncomment and configure when ready):
    
    // PayPal configuration
    const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';
    const returnUrl = window.location.origin + '/payment-success';
    const cancelUrl = window.location.origin + '/payment-cancelled';
    
    // Create PayPal payment button or redirect
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=YOUR_PAYPAL_EMAIL&item_name=BCSME Membership&amount=${amount}&currency_code=CAD&return=${returnUrl}&cancel_return=${cancelUrl}&custom=${applicationId}`;
    
    window.location.href = paypalUrl;
    */
}
