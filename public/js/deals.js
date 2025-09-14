// Deals Management JavaScript Functionality
const DealsManager = {
    // API endpoint
    API_BASE: '/deals',
    
    // DOM Elements
    elements: {
        notification: document.getElementById('notification'),
        totalDeals: document.getElementById('totalDeals'),
        totalValue: document.getElementById('totalValue'),
        pipelineStages: document.getElementById('pipelineStages'),
        dealsTable: document.getElementById('dealsTable'),
        customerSelect: document.getElementById('customer_id'),
        dealForm: document.getElementById('dealForm')
    },
    
    // Initialize the deals manager
    init: function() {
        // Check if we're on the deals page
        if (!this.elements.dealForm) {
            return;
        }
        
        this.bindEvents();
        this.loadInitialData();
        this.startPeriodicUpdates();
    },
    
    // Bind events
    bindEvents: function() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab);
            });
        });
        
        // Refresh button
        document.getElementById('refreshDeals').addEventListener('click', () => {
            this.loadDeals();
        });
        
        // Form submission
        this.elements.dealForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createDeal();
        });
    },
    
    // Switch tab
    switchTab: function(tab) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabName = tab.getAttribute('data-tab');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    },
    
    // Load initial data
    loadInitialData: function() {
        this.loadCustomers();
        this.loadDeals();
        this.loadDealsSummary();
        this.loadDealsNearingDeadline();
    },
    
    // Start periodic updates
    startPeriodicUpdates: function() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadDeals();
            this.loadDealsSummary();
            this.loadDealsNearingDeadline();
        }, 30000);
    },
    
    // Load customers for dropdown
    loadCustomers: async function() {
        try {
            const response = await fetch('/customer/');
            if (response.ok) {
                const customers = await response.json();
                if (this.elements.customerSelect) {
                    this.elements.customerSelect.innerHTML = '<option value="">Select a customer</option>';
                    customers.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = customer.username;
                        this.elements.customerSelect.appendChild(option);
                    });
                }
            } else {
                console.error('Failed to load customers. Status:', response.status);
                this.showNotification('Failed to load customers', 'error');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Error loading customers: ' + error.message, 'error');
        }
    },
    
    // Load deals
    loadDeals: async function() {
        try {
            if (!this.elements.dealsTable) {
                console.error('Deals table element not found');
                return;
            }
            
            this.elements.dealsTable.innerHTML = '<div class="loading">Loading deals...</div>';
            
            const response = await fetch(this.API_BASE);
            if (response.ok) {
                const deals = await response.json();
                this.renderDealsTable(deals);
            } else {
                const errorText = await response.text();
                console.error('Error loading deals. Status:', response.status, 'Response:', errorText);
                this.elements.dealsTable.innerHTML = '<div class="loading">Error loading deals: ' + response.status + '</div>';
            }
        } catch (error) {
            console.error('Network error loading deals:', error);
            if (this.elements.dealsTable) {
                this.elements.dealsTable.innerHTML = '<div class="loading">Network error occurred: ' + error.message + '</div>';
            }
        }
    },
    
    // Render deals table
    renderDealsTable: function(deals) {
        if (deals.length === 0) {
            this.elements.dealsTable.innerHTML = '<div class="loading">No deals found</div>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Customer</th>
                        <th>Value</th>
                        <th>Stage</th>
                        <th>Probability</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        deals.forEach(deal => {
            const deadline = deal.dead_line ? new Date(deal.dead_line).toLocaleDateString() : 'N/A';
            const value = deal.value ? `$${parseFloat(deal.value).toFixed(2)}` : '$0.00';
            
            // Check if deal is nearing deadline
            let deadlineClass = '';
            if (deal.dead_line && new Date(deal.dead_line) < new Date(Date.now() + 7 * 24 * 60 * 1000)) {
                deadlineClass = ' style="color: #e53e3e; font-weight: bold;"';
            }
            
            tableHTML += `
                <tr>
                    <td>${deal.title}</td>
                    <td>${deal.customer_name || 'No customer'}</td>
                    <td>${value}</td>
                    <td><span class="stage-badge stage-${deal.stage}">${deal.stage.replace('_', ' ')}</span></td>
                    <td>${deal.probability}%</td>
                    <td${deadlineClass}>${deadline}</td>
                    <td class="actions">
                        <button class="action-btn btn-secondary" onclick="DealsManager.progressDeal(${deal.id}, 'backward')" title="Move to previous stage">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <button class="action-btn btn-primary" onclick="DealsManager.editDeal(${deal.id})" title="Edit deal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-secondary" onclick="DealsManager.progressDeal(${deal.id}, 'forward')" title="Move to next stage">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="action-btn btn-danger" onclick="DealsManager.deleteDeal(${deal.id})" title="Delete deal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        this.elements.dealsTable.innerHTML = tableHTML;
    },
    
    // Load deals summary
    loadDealsSummary: async function() {
        try {
            const response = await fetch(`${this.API_BASE}/summary`);
            if (response.ok) {
                const summary = await response.json();
                this.updateSummary(summary);
            }
        } catch (error) {
            console.error('Error loading deals summary:', error);
        }
    },
    
    // Update summary
    updateSummary: function(summary) {
        this.elements.totalDeals.textContent = summary.totalDeals;
        this.elements.totalValue.textContent = `$${parseFloat(summary.totalValue || 0).toFixed(2)}`;
        
        // Render pipeline stages
        let pipelineHTML = '';
        const stageOrder = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
        const stageLabels = {
            'prospect': 'Prospect',
            'qualification': 'Qualification',
            'proposal': 'Proposal',
            'negotiation': 'Negotiation',
            'closed_won': 'Closed Won',
            'closed_lost': 'Closed Lost'
        };
        
        // Create a map of stage counts
        const stageCounts = {};
        summary.dealsByStage.forEach(stage => {
            stageCounts[stage.stage] = stage.count;
        });
        
        // Render each stage
        stageOrder.forEach(stage => {
            const count = stageCounts[stage] || 0;
            pipelineHTML += `
                <div class="pipeline-stage">
                    <h3>${stageLabels[stage]}</h3>
                    <div class="pipeline-count">${count}</div>
                </div>
            `;
        });
        
        this.elements.pipelineStages.innerHTML = pipelineHTML;
    },
    
    // Load deals nearing deadline
    loadDealsNearingDeadline: async function() {
        try {
            const response = await fetch(`${this.API_BASE}/deadline/reminders`);
            if (response.ok) {
                const deals = await response.json();
                this.showDeadlineReminders(deals);
            }
        } catch (error) {
            console.error('Error loading deals nearing deadline:', error);
        }
    },
    
    // Show deadline reminders
    showDeadlineReminders: function(deals) {
        if (deals.length > 0) {
            let reminderText = `You have ${deals.length} deal(s) with upcoming deadlines:\n`;
            deals.forEach(deal => {
                const deadline = new Date(deal.dead_line).toLocaleDateString();
                reminderText += `- ${deal.title} (${deadline})\n`;
            });
            
            // In a real application, you might show this in a modal or notification area
            console.log(reminderText);
        }
    },
    
    // Create deal
    createDeal: async function() {
        if (!this.elements.dealForm) {
            console.error('Deal form element not found');
            this.showNotification('Form not found. Please refresh the page.', 'error');
            return;
        }
        
        const formData = new FormData(this.elements.dealForm);
        const dealData = Object.fromEntries(formData.entries());
        
        // Convert value to number if provided
        if (dealData.value) {
            dealData.value = parseFloat(dealData.value);
        }
        
        // Convert probability to number
        dealData.probability = parseInt(dealData.probability) || 0;
        
        // Remove empty customer_id
        // This handles cases where customer_id might be an empty string, "0", or other invalid values
        if (!dealData.customer_id || dealData.customer_id === "" || dealData.customer_id === "0") {
            delete dealData.customer_id;
        }
        
        try {
            const response = await fetch(this.API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dealData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification('Deal created successfully!', 'success');
                this.elements.dealForm.reset();
                this.loadDeals();
                this.loadDealsSummary();
                
                // Notify other pages that a deal was added
                if (typeof window.onDealAdded === 'function') {
                    window.onDealAdded();
                }
                
                // Switch to view tab
                const viewTab = document.querySelector('.tab[data-tab="view"]');
                if (viewTab) {
                    viewTab.click();
                }
            } else {
                const errorText = await response.text();
                let errorMessage = 'Failed to create deal';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If parsing fails, use the raw text
                    errorMessage = errorText || errorMessage;
                }
                
                this.showNotification(`Error: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Network error creating deal:', error);
            this.showNotification('Network error occurred. Please try again. ' + error.message, 'error');
        }
    },
    
    // Progress deal stage
    progressDeal: async function(id, direction) {
        try {
            const response = await fetch(`${this.API_BASE}/${id}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ direction: direction })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                this.loadDeals();
                this.loadDealsSummary();
                
                // Notify other pages that a deal was updated
                if (typeof window.onDealUpdated === 'function') {
                    window.onDealUpdated();
                }
            } else {
                const errorData = await response.json();
                this.showNotification(`Error: ${errorData.message || 'Failed to progress deal'}`, 'error');
            }
        } catch (error) {
            console.error('Error progressing deal:', error);
            this.showNotification('Network error occurred. Please try again.', 'error');
        }
    },
    
    // Edit deal (placeholder)
    editDeal: function(id) {
        this.showNotification('Edit functionality would be implemented here', 'success');
    },
    
    // Delete deal
    deleteDeal: async function(id) {
        if (!confirm('Are you sure you want to delete this deal?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message || 'Deal deleted successfully!', 'success');
                this.loadDeals();
                this.loadDealsSummary();
                
                // Notify other pages that a deal was deleted
                if (typeof window.onDealDeleted === 'function') {
                    window.onDealDeleted();
                }
            } else {
                const errorData = await response.json();
                this.showNotification(`Error: ${errorData.message || 'Failed to delete deal'}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting deal:', error);
            this.showNotification('Network error occurred. Please try again.', 'error');
        }
    },
    
    // Show notification
    showNotification: function(message, type) {
        if (!this.elements.notification) return;
        
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type}`;
        this.elements.notification.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.elements.notification.style.display = 'none';
        }, 3000);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    DealsManager.init();
});

// Handle cases where DOM content is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        DealsManager.init();
    });
} else {
    // DOM is already loaded
    DealsManager.init();
}

// Export for global access
window.DealsManager = DealsManager;

// Expose a convenience global used by gm_dash.html
window.updateDashboardDeals = function() {
    // Use DealsManager to load and apply the latest summary
    if (window.DealsManager) {
        DealsManager.loadDealsSummary();
    }
};

// Global function to notify when a deal is added
window.onDealAdded = function() {
    console.log('Deal added, refreshing dashboard deals...');
    // Refresh deals summary
    if (window.DealsManager) {
        DealsManager.loadDealsSummary();
    }
    // Also update the dashboard
    if (typeof window.updateDashboardDeals === 'function') {
        window.updateDashboardDeals();
    }
};

// Global function to notify when a deal is updated
window.onDealUpdated = function() {
    console.log('Deal updated, refreshing dashboard deals...');
    // Refresh deals summary
    if (window.DealsManager) {
        DealsManager.loadDealsSummary();
    }
    // Also update the dashboard
    if (typeof window.updateDashboardDeals === 'function') {
        window.updateDashboardDeals();
    }
};

// Global function to notify when a deal is deleted
window.onDealDeleted = function() {
    console.log('Deal deleted, refreshing dashboard deals...');
    // Refresh deals summary
    if (window.DealsManager) {
        DealsManager.loadDealsSummary();
    }
    // Also update the dashboard
    if (typeof window.updateDashboardDeals === 'function') {
        window.updateDashboardDeals();
    }
};