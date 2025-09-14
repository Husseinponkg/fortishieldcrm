document.addEventListener("DOMContentLoaded", () => {
  const smsForm = document.getElementById("smsForm");
  
  if (smsForm) {
    smsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const message = document.getElementById("text").value.trim();
      const phoneNumbersRaw = document.getElementById("phone_numbers").value.trim();

      // Validation
      if (!message) {
        alert("Please enter a message");
        return;
      }

      if (!phoneNumbersRaw) {
        alert("Please enter at least one phone number");
        return;
      }

      // Split input into an array of phone numbers
      const phone_numbers = phoneNumbersRaw.split(",").map(num => num.trim()).filter(num => num);

      if (phone_numbers.length === 0) {
        alert("Please enter valid phone numbers");
        return;
      }

      try {
        const res = await fetch("/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            phone_numbers
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success) {
          alert("SMS sent successfully!");
          smsForm.reset();
        } else {
          alert("Failed to send SMS: " + JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error("Error sending SMS:", error);
        alert("Error sending SMS: " + error.message);
      }
    });
  }
});
