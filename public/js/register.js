document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const roles = document.getElementById('roles').value.trim();
  const contacts = document.getElementById('contacts').value.trim();
  const password = document.getElementById('password').value.trim();

  // Validation
  if (!username || !email || !roles || !contacts || !password) {
    alert("All fields are required!");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  const data = { username, email, roles, contacts, password };

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Registration response:', result);

    if (response.ok && result.success) {
      alert("Registration successful!");
      window.location.href = "index.html";
    } else {
      alert("Registration failed: " + (result.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert(" Something went wrong. Please try again later.");
  }
});
