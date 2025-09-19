# Fortishield CRM Admin System

## Overview

The Fortishield CRM Admin System provides special administrative capabilities for managing the entire CRM system. This system includes a special admin user with unique privileges and capabilities.

## Features

1. **Special Admin User**
   - Only one admin user is allowed in the system
   - Special ID and password for secure access
   - Can add another admin if needed (but only one can exist at a time)

2. **User Management**
   - View all users in the system
   - Add new users
   - Delete users
   - Edit user information

3. **Activity Monitoring**
   - View recent system activities
   - Monitor user actions
   - Track system events

4. **System Logs**
   - View system logs
   - Filter logs by level (info, warning, error)
   - Clear logs when needed

5. **Troubleshooting**
   - Run system diagnostics
   - Check system health
   - Restart services
   - Reset system if needed

6. **System Management**
   - Manage all system functions when it goes down
   - Perform maintenance tasks
   - Monitor system performance

## Getting Started

### Initial Setup

1. Run the admin initialization script to create the first admin user:
   ```
   npm run init:admin
   ```

2. This will create an admin user with the following credentials:
   - Username: `superadmin`
   - Password: `superadmin123`

3. **Important**: Change the password after logging in for the first time.

### Accessing the Admin System

1. Navigate to the admin login page:
   ```
   http://localhost:3000/public/admin/login.html
   ```

2. Log in with the admin credentials.

3. Once logged in, you'll have access to the admin dashboard with all the management capabilities.

## Admin Dashboard Pages

1. **Main Dashboard**
   - System overview
   - Quick statistics
   - Quick action buttons

2. **User Manager**
   - Manage all users
   - Add/delete users
   - Edit user information

3. **Activity**
   - View recent system activities
   - Filter activities by status

4. **Logs**
   - View system logs
   - Filter logs by level
   - Clear logs

5. **Troubleshoot**
   - Run system diagnostics
   - Check system health
   - Perform maintenance tasks

## Security Considerations

1. The admin system uses a special authentication mechanism with the `adminUsername` header.
2. Only one admin user is allowed in the system at a time.
3. The admin can add another admin, but this is restricted to maintain security.
4. All admin actions are logged for security auditing.

## API Endpoints

The admin system exposes the following API endpoints:

- `POST /admin/create-admin` - Create the first admin user
- `POST /admin/add-another-admin` - Add another admin (special function)
- `POST /admin/login` - Admin login
- `GET /admin/get-all-users` - Get all users
- `DELETE /admin/delete-user/:userId` - Delete a user
- `GET /admin/get-system-stats` - Get system statistics
- `GET /admin/get-system-logs` - Get system logs
- `GET /admin/get-recent-activities` - Get recent activities
- `GET /admin/troubleshoot-system` - Troubleshoot system issues

## Troubleshooting

If you encounter issues with the admin system:

1. Ensure the admin user has been initialized using `npm run init:admin`
2. Check that the server is running
3. Verify the database connection
4. Check the system logs for error messages

For any other issues, please contact the Fortishield CRM support team.