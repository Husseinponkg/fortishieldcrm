document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const roles = document.getElementById('roles').value.trim();

  if (!username || !password || !roles) {
    alert("All fields are required!");
    return;
  }

  const loginData = { username, password, roles };

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert("Login successful!");

      // Redirect based on role
      switch (roles.toLowerCase()) {
        case 'general_manager':
          window.location.href = "../gm_dash/gm_dash.html";
          break;
        case 'project_manager':
          window.location.href = "../project_manager/pm_dash.html";
          break;
        case 'developer':
          window.location.href = "../developer/developer_dash.html";
          break;
        case'customer_admin':
        window.location.href="../customer/customer_dash.html";
        default:
          alert("Unauthorized access");
      }
    } else {

      alert("Login failed: " + (result.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again later.");
  }
});
