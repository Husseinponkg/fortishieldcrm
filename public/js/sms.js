 // Validate phone number format (E.164)
    function isValidPhone(phone) {
      return /^\+\d{10,15}$/.test(phone);
    }

    // Test configuration
    document.getElementById('testConfig').addEventListener('click', async () => {
      const resultDiv = document.getElementById('configResult');
      resultDiv.style.display = 'block';
      resultDiv.className = 'message info';
      resultDiv.textContent = 'Testing...';
      try {
        const response = await fetch('/sms/test');
        const data = await response.json();
        if (data.success) {
          resultDiv.className = 'message success';
          resultDiv.textContent = `SUCCESS: ${data.message}`;
        } else {
          resultDiv.className = 'message error';
          resultDiv.textContent = `ERROR: ${data.message}`;
        }
      } catch (err) {
        resultDiv.className = 'message error';
        resultDiv.textContent = `NETWORK ERROR: ${err.message}`;
      }
    });

    // Send SMS
    document.getElementById('sendTest').addEventListener('click', async () => {
      const message = document.getElementById('testMessage').value.trim();
      const phoneInput = document.getElementById('testPhone').value.trim();
      const resultDiv = document.getElementById('sendResult');
      const resultList = document.getElementById('resultList');
      resultList.innerHTML = "";

      if (!message) { alert('Please enter a message'); return; }
      if (!phoneInput) { alert('Please enter phone numbers'); return; }

      // Parse, trim, deduplicate
      const phoneNumbers = Array.from(new Set(
        phoneInput.split(',').map(p => p.trim()).filter(p => isValidPhone(p))
      ));

      if (phoneNumbers.length === 0) {
        alert('No valid phone numbers found. Use format +255...');
        return;
      }

      resultDiv.style.display = 'block';
      resultDiv.className = 'message info';
      resultDiv.textContent = 'Sending...';

      try {
        const response = await fetch('/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, phone_numbers: phoneNumbers })
        });
        const data = await response.json();

        if (data.success) {
          resultDiv.className = 'message success';
          resultDiv.textContent = `SUCCESS: ${data.message}`;
          data.results.forEach(r => {
            const li = document.createElement('li');
            li.textContent = `${r.to}: ${r.status}`;
            resultList.appendChild(li);
          });
        } else {
          resultDiv.className = 'message error';
          resultDiv.textContent = `ERROR: ${data.message}`;
        }
      } catch (err) {
        resultDiv.className = 'message error';
        resultDiv.textContent = `NETWORK ERROR: ${err.message}`;
      }
    });