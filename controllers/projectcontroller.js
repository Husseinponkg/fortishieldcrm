const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // save files to /uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unique file name
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Controller - Add Project
const addProject = async (req, res) => {
    try {
        const { title, description, status, start_date, end_date, assigned_to } = req.body;

        // If a file is uploaded
        const report_upload = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO projects 
            (title, description, status, start_date, end_date, assigned_to, report_upload) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            title, description, status, start_date, end_date, assigned_to, report_upload
        ]);

        res.status(201).json({ message: 'Project added successfully', projectId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding project', error: error.message });
    }
};

// Controller - Fetch Projects
const fetchProjects = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM projects');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

// Controller - Fetch Single Project
const fetchProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Error fetching project', error: error.message });
    }
};

// Controller - Update Project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, start_date, end_date, assigned_to } = req.body;

        // Check if project exists
        const [existingProject] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existingProject.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Handle file upload
        let report_upload = existingProject[0].report_upload; // Keep existing file by default
        if (req.file) {
            // If a new file is uploaded, use it
            report_upload = req.file.filename;
            
            // Optionally delete the old file
            if (existingProject[0].report_upload) {
                const oldFilePath = path.join(uploadsDir, existingProject[0].report_upload);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }

        const sql = `
            UPDATE projects 
            SET title = ?, description = ?, status = ?, start_date = ?, end_date = ?, assigned_to = ?, report_upload = ?
            WHERE id = ?
        `;

        await db.execute(sql, [
            title, description, status, start_date, end_date, assigned_to, report_upload, id
        ]);

        res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Controller - Delete Project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const [existingProject] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existingProject.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete associated file if it exists
        if (existingProject[0].report_upload) {
            const filePath = path.join(uploadsDir, existingProject[0].report_upload);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete project from database
        await db.execute('DELETE FROM projects WHERE id = ?', [id]);

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};

module.exports = { addProject, fetchProjects, fetchProjectById, updateProject, deleteProject, upload };
