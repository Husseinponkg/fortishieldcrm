const api = '/customer/';

document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form elements
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    // Get form data
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        contacts: document.getElementById('contacts').value,
        service: document.getElementById('service').value,
        details: document.getElementById('details').value
    };

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        const response = await fetch(api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Customer added:', result);
            alert('Customer added successfully!');
            // Reset form after successful submission
            form.reset();
            // Notify the trends page to update the charts
            if (typeof window.onCustomerAdded === 'function') {
                window.onCustomerAdded();
            }
        } else {
            const errorData = await response.json();
            console.error('Error adding customer:', errorData.message || response.statusText);
            alert('Error adding customer: ' + (errorData.message || response.statusText));
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error occurred. Please try again.');
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});
