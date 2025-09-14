// Function to fetch and display projects assigned to the developer
const viewProjects = async (filterAssigned = true) => {
    try {
        // Show loading state
        const tableBody = document.getElementById('developerTableBody');
        tableBody.innerHTML = '<tr><td colspan="8">Loading projects...</td></tr>';
        
        const response = await fetch('/projects');
        const data = await response.json();
        
        if (response.ok) {
            // Clear existing content
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8">No projects found.</td></tr>';
                return;
            }
            
            // In a real application, you would get the developer name from authentication
            // For demonstration, we'll filter by a sample developer name
            // In a real app, you would replace 'Sample Developer' with the actual logged-in user's name
            const currentDeveloper = 'Sample Developer'; // This would come from authentication
            
            // Filter projects assigned to the current developer if filter is enabled
            let filteredData = data;
            if (filterAssigned) {
                filteredData = data.filter(project => project.assigned_to === currentDeveloper);
            }
            
            if (filteredData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8">No projects found for you.</td></tr>';
                return;
            }
            
            filteredData.forEach(project => {
                const row = document.createElement('tr');
                
                // Format dates
                const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : '';
                const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString() : '';
                const createdAt = project.created_at ? new Date(project.created_at).toLocaleDateString() : '';
                
                // Status class for styling
                let statusClass = 'status-not-started';
                if (project.status === 'in progress') statusClass = 'status-in-progress';
                if (project.status === 'completed') statusClass = 'status-completed';
                if (project.status === 'on hold') statusClass = 'status-on-hold';
                
                row.innerHTML = `
                    <td>${project.title}</td>
                    <td>${project.description}</td>
                    <td><span class="status ${statusClass}">${project.status}</span></td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td>${createdAt}</td>
                    <td>${project.assigned_to}</td>
                    <td>${project.report_upload ? `<a href="/uploads/${project.report_upload}" target="_blank">View</a>` : 'No attachment'}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="8">Error loading projects. Please try again later.</td></tr>';
            console.error('Error fetching projects:', data);
        }
    } catch (error) {
        document.getElementById('developerTableBody').innerHTML = '<tr><td colspan="8">Error loading projects. Please try again later.</td></tr>';
        console.error('Error fetching projects:', error);
    }
};

// Load projects when page loads
document.addEventListener('DOMContentLoaded', () => viewProjects(true));