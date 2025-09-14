
const express = require('express');
const router = express.Router();
const { addProject, fetchProjects, fetchProjectById, updateProject, deleteProject, upload } = require('../controllers/projectcontroller');

// 👉 Add new project (with file upload)
router.post('/add', upload.single('report_upload'), addProject);

// 👉 Fetch all projects
router.get('/', fetchProjects);

// 👉 Fetch single project by ID
router.get('/:id', fetchProjectById);

// 👉 Update project (with file upload)
router.put('/:id', upload.single('report_upload'), updateProject);

// 👉 Delete project
router.delete('/:id', deleteProject);

module.exports = router;
