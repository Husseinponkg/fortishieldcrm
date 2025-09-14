document.getElementById("projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = document.getElementById("projectForm");
    const formData = new FormData(form);
    
    // Get form values for validation
    const title = formData.get('title');
    const description = formData.get('description');
    const status = formData.get('status');
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');
    const assigned_to = formData.get('assigned_to');
    
    // Basic validation
    if (!title || !description || !status || !start_date || !end_date || !assigned_to) {
        alert("Please fill in all required fields.");
        return;
    }
    
    // Date validation
    if (new Date(end_date) < new Date(start_date)) {
        alert("End date must be after start date.");
        return;
    }

    try {
        const response = await fetch("/projects/add", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert("Project added successfully! ID: " + result.projectId);
            form.reset();
            // Redirect to projects page after successful submission
            window.location.href = "pm_projects.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Something went wrong. Please try again.");
    }
});
