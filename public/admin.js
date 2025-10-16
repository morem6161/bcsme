// Admin Dashboard JavaScript

let currentApplicationId = null;

// Check authentication on page load
checkAuth();

async function checkAuth() {
    const response = await fetch('/api/admin/check');
    const data = await response.json();
    
    if (data.authenticated) {
        showDashboard(data.username);
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard(username) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('adminUsername').textContent = username;
    loadAllData();
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDashboard(data.username);
        } else {
            document.getElementById('loginError').textContent = 'Invalid username or password';
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = 'Login failed. Please try again.';
        document.getElementById('loginError').style.display = 'block';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
    await fetch('/api/admin/logout', { method: 'POST' });
    showLogin();
});

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Load data for the tab
    if (tabName === 'pending') {
        loadPendingApplications();
    } else if (tabName === 'all') {
        loadAllApplications();
    } else if (tabName === 'members') {
        loadMembers();
    } else if (tabName === 'board-review') {
        loadBoardReviewList();
    }
}

function loadAllData() {
    loadPendingApplications();
    loadAllApplications();
    loadMembers();
}

// Load pending applications
async function loadPendingApplications() {
    try {
        const response = await fetch('/api/admin/applications/pending');
        const applications = await response.json();
        
        const container = document.getElementById('pendingApplicationsList');
        
        if (applications.length === 0) {
            container.innerHTML = '<p class="info-text">No pending applications at this time.</p>';
            return;
        }
        
        container.innerHTML = applications.map(app => createApplicationCard(app)).join('');
        
        // Add click handlers
        container.querySelectorAll('.application-card').forEach(card => {
            card.addEventListener('click', function() {
                showApplicationDetails(this.dataset.id);
            });
        });
    } catch (error) {
        console.error('Error loading pending applications:', error);
    }
}

// Load all applications
async function loadAllApplications() {
    try {
        const response = await fetch('/api/admin/applications');
        const applications = await response.json();
        
        const container = document.getElementById('allApplicationsList');
        
        if (applications.length === 0) {
            container.innerHTML = '<p class="info-text">No applications yet.</p>';
            return;
        }
        
        container.innerHTML = applications.map(app => createApplicationCard(app, true)).join('');
        
        // Add click handlers
        container.querySelectorAll('.application-card').forEach(card => {
            card.addEventListener('click', function() {
                showApplicationDetails(this.dataset.id);
            });
        });
        
        // Apply filters
        applyFilters();
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Filter controls
document.querySelectorAll('.filter-controls input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
});

function applyFilters() {
    const filterPaid = document.getElementById('filterPaid').checked;
    const filterPending = document.getElementById('filterPending').checked;
    const filterApproved = document.getElementById('filterApproved').checked;
    const filterRejected = document.getElementById('filterRejected').checked;
    
    document.querySelectorAll('#allApplicationsList .application-card').forEach(card => {
        const paymentStatus = card.dataset.paymentStatus;
        const approvalStatus = card.dataset.approvalStatus;
        
        let show = false;
        
        if (filterPaid && paymentStatus === 'completed') show = true;
        if (filterPending && paymentStatus === 'pending') show = true;
        if (filterApproved && approvalStatus === 'approved') show = true;
        if (filterRejected && approvalStatus === 'rejected') show = true;
        
        card.style.display = show ? 'block' : 'none';
    });
}

// Create application card HTML
function createApplicationCard(app, showAllStatuses = false) {
    const date = new Date(app.created_at).toLocaleDateString();
    
    let statusBadges = '';
    if (showAllStatuses) {
        statusBadges += `<span class="status-badge status-${app.payment_status}">${app.payment_status}</span> `;
        statusBadges += `<span class="status-badge status-${app.board_approval_status}">${app.board_approval_status}</span>`;
    } else {
        statusBadges = `<span class="status-badge status-${app.board_approval_status}">Awaiting Board Approval</span>`;
    }
    
    const sponsorWarning = app.sponsor_issues ? 
        `<div class="warning-badge">⚠️ Sponsor Issue: ${app.sponsor_issues}</div>` : '';
    
    return `
        <div class="application-card" data-id="${app.id}" data-payment-status="${app.payment_status}" data-approval-status="${app.board_approval_status}">
            <div class="application-header">
                <div>
                    <div class="application-name">${app.name}</div>
                    <div class="detail-item">${app.email}</div>
                </div>
                <div>${statusBadges}</div>
            </div>
            <div class="application-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Category:</span> ${app.membership_category}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fee:</span> $${app.membership_fee}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Applied:</span> ${date}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Payment:</span> ${app.payment_status}
                </div>
            </div>
            ${sponsorWarning}
        </div>
    `;
}

// Show application details modal
async function showApplicationDetails(applicationId) {
    currentApplicationId = applicationId;
    
    try {
        const response = await fetch('/api/admin/applications');
        const applications = await response.json();
        const app = applications.find(a => a.id == applicationId);
        
        if (!app) return;
        
        const details = document.getElementById('applicationDetails');
        details.innerHTML = `
            <div class="application-details-full">
                <h3>${app.name}</h3>
                <p><strong>Email:</strong> ${app.email}</p>
                <p><strong>Birthdate:</strong> ${app.birthdate || 'Not provided'}</p>
                <p><strong>Address:</strong> ${app.address || 'Not provided'}</p>
                <p><strong>City:</strong> ${app.city || 'Not provided'}, ${app.province_state || ''} ${app.postal_code || ''}</p>
                <p><strong>Phone:</strong> ${app.phone_other || 'Not provided'}</p>
                <p><strong>Preferred Contact:</strong> ${app.preferred_contact}</p>
                
                <hr style="margin: 20px 0;">
                
                <p><strong>Membership Category:</strong> ${app.membership_category}</p>
                <p><strong>Membership Fee:</strong> $${app.membership_fee}</p>
                <p><strong>Payment Status:</strong> ${app.payment_status}</p>
                ${app.payment_id ? `<p><strong>Payment ID:</strong> ${app.payment_id}</p>` : ''}
                
                ${app.junior_sponsor1 ? `
                    <hr style="margin: 20px 0;">
                    <p><strong>Junior Sponsor 1:</strong> ${app.junior_sponsor1}</p>
                    <p><strong>Junior Sponsor 2:</strong> ${app.junior_sponsor2}</p>
                ` : ''}
                
                ${app.probationary_guardian ? `
                    <hr style="margin: 20px 0;">
                    <p><strong>Parent/Guardian:</strong> ${app.probationary_guardian}</p>
                ` : ''}
                
                ${app.sponsor_issues ? `
                    <div class="warning-badge">⚠️ ${app.sponsor_issues}</div>
                ` : ''}
                
                <hr style="margin: 20px 0;">
                
                <p><strong>Areas of Interest:</strong></p>
                <p>${app.areas_of_interest || 'None selected'}</p>
                
                <p><strong>Publish in Directory:</strong> ${app.publish_in_directory ? 'Yes' : 'No'}</p>
                
                <hr style="margin: 20px 0;">
                
                <p><strong>Application Date:</strong> ${new Date(app.created_at).toLocaleString()}</p>
                <p><strong>Board Approval Status:</strong> ${app.board_approval_status}</p>
                ${app.board_approval_date ? `<p><strong>Approval Date:</strong> ${new Date(app.board_approval_date).toLocaleString()}</p>` : ''}
                ${app.board_notes ? `<p><strong>Board Notes:</strong> ${app.board_notes}</p>` : ''}
                
                ${app.signature_data ? `
                    <hr style="margin: 20px 0;">
                    <p><strong>Signature:</strong></p>
                    <img src="${app.signature_data}" style="border: 1px solid #ddd; max-width: 300px;">
                ` : ''}
            </div>
        `;
        
        // Show/hide approve/reject buttons based on status
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        
        if (app.board_approval_status === 'pending' && app.payment_status === 'completed') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
        
        document.getElementById('applicationModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading application details:', error);
    }
}

// Approve application
document.getElementById('approveBtn').addEventListener('click', async function() {
    if (!currentApplicationId) return;
    
    const notes = prompt('Enter any notes (optional):');
    
    try {
        const response = await fetch(`/api/admin/applications/${currentApplicationId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                notes: notes || ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Application approved successfully!');
            document.getElementById('applicationModal').style.display = 'none';
            loadAllData();
        }
    } catch (error) {
        console.error('Error approving application:', error);
        alert('Error approving application');
    }
});

// Reject application
document.getElementById('rejectBtn').addEventListener('click', async function() {
    if (!currentApplicationId) return;
    
    const notes = prompt('Enter reason for rejection:');
    if (!notes) return;
    
    try {
        const response = await fetch(`/api/admin/applications/${currentApplicationId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Application rejected');
            document.getElementById('applicationModal').style.display = 'none';
            loadAllData();
        }
    } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Error rejecting application');
    }
});

// Close modal
document.querySelectorAll('.close, .close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    });
});

// Close modal on outside click
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Load members
async function loadMembers() {
    try {
        const response = await fetch('/api/admin/members');
        const members = await response.json();
        
        const container = document.getElementById('membersList');
        
        if (members.length === 0) {
            container.innerHTML = '<p class="info-text">No members yet. Members will appear here after their applications are approved, or you can add them manually.</p>';
            return;
        }
        
        container.innerHTML = members.map(member => `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-email">${member.email}</div>
                    <div class="member-type">${member.membership_type}</div>
                </div>
                <span class="status-badge status-${member.status}">${member.status}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Add member button
document.getElementById('addMemberBtn').addEventListener('click', function() {
    document.getElementById('addMemberModal').style.display = 'block';
});

// Member search
document.getElementById('memberSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('.member-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
});

// Board review list
async function loadBoardReviewList() {
    try {
        const response = await fetch('/api/admin/applications/pending');
        const applications = await response.json();
        
        const container = document.getElementById('boardReviewList');
        
        if (applications.length === 0) {
            container.innerHTML = '<p class="info-text">No applications pending board review.</p>';
            return;
        }
        
        let html = `
            <h3 style="text-align: center; margin-bottom: 20px;">BCSME Board Review List</h3>
            <p style="text-align: center; margin-bottom: 30px;">Generated: ${new Date().toLocaleDateString()}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #333;">
                        <th style="text-align: left; padding: 10px;">Name</th>
                        <th style="text-align: left; padding: 10px;">Category</th>
                        <th style="text-align: left; padding: 10px;">Fee</th>
                        <th style="text-align: left; padding: 10px;">Applied</th>
                        <th style="text-align: left; padding: 10px;">Notes</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        applications.forEach(app => {
            const date = new Date(app.created_at).toLocaleDateString();
            const notes = app.sponsor_issues ? `⚠️ ${app.sponsor_issues}` : '';
            
            html += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${app.name}</td>
                    <td style="padding: 10px;">${app.membership_category}</td>
                    <td style="padding: 10px;">$${app.membership_fee}</td>
                    <td style="padding: 10px;">${date}</td>
                    <td style="padding: 10px;">${notes}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div style="margin-top: 40px; page-break-before: always;">
                <h4>Approval Signatures:</h4>
                <div style="margin-top: 30px;">
                    <p>_________________________ Date: __________</p>
                    <p style="margin-top: 30px;">_________________________ Date: __________</p>
                    <p style="margin-top: 30px;">_________________________ Date: __________</p>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading board review list:', error);
    }
}

// Print board list
document.getElementById('printBoardList').addEventListener('click', function() {
    window.print();
});
