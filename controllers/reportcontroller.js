const db = require('../config/db');
const { PDFDocument, rgb } = require('pdf-lib');
const docx = require('docx');
const fs = require('fs').promises;
const path = require('path');

const reportsDir = path.join(__dirname, '../reports');
fs.mkdir(reportsDir, { recursive: true }).catch(console.error);

// ----------------------------
// Create a new report
// ----------------------------
const createReport = async (req, res) => {
    try {
        const {
            title,
            task_type,
            task_status,
            description,
            file_extension,
            signature,
            customer_id,
            project_id,
            created_by
        } = req.body;

        if (!title || !task_type || !task_status || !description || !file_extension || !signature) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        let fileName = `report_${Date.now()}.${file_extension}`;
        let filePath = path.join(reportsDir, fileName);

        // ------------------------
        // Generate file by extension
        // ------------------------
        if (file_extension === 'pdf') {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([600, 800]);
            const { height } = page.getSize();

            page.drawText(title, { x: 50, y: height - 50, size: 18, color: rgb(0, 0, 0) });
            page.drawText(`Task Type: ${task_type}`, { x: 50, y: height - 80, size: 12 });
            page.drawText(`Status: ${task_status}`, { x: 50, y: height - 100, size: 12 });
            page.drawText('Description:', { x: 50, y: height - 130, size: 14 });

            const descLines = description.split('\n');
            let y = height - 150;
            descLines.forEach(line => {
                page.drawText(line, { x: 50, y, size: 10 });
                y -= 18;
            });

            page.drawText(`Signature: ${signature}`, { x: 50, y: y - 30, size: 12 });
            page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 50, y: y - 50, size: 10 });

            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(filePath, pdfBytes);

        } else if (file_extension === 'docx' || file_extension === 'doc') {
            const { Document, Paragraph, HeadingLevel, Packer } = docx;
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
                        new Paragraph({ text: `Task Type: ${task_type}` }),
                        new Paragraph({ text: `Status: ${task_status}` }),
                        new Paragraph({ text: 'Description:' }),
                        new Paragraph({ text: description }),
                        new Paragraph({ text: `Signature: ${signature}` }),
                        new Paragraph({ text: `Generated: ${new Date().toLocaleString()}` })
                    ]
                }]
            });
            const buffer = await Packer.toBuffer(doc);
            await fs.writeFile(filePath, buffer);

        } else if (file_extension === 'txt') {
            const content =
                `REPORT: ${title}\n` +
                `Task Type: ${task_type}\n` +
                `Status: ${task_status}\n` +
                `Description: ${description}\n` +
                `Signature: ${signature}\n` +
                `Generated: ${new Date().toLocaleString()}`;
            await fs.writeFile(filePath, content);

        } else if (file_extension === 'rtf') {
            // Simple RTF content
            const rtfContent = `{\\rtf1\\ansi
{\\b REPORT:} ${title}\\line
Task Type: ${task_type}\\line
Status: ${task_status}\\line
Description: ${description}\\line
Signature: ${signature}\\line
Generated: ${new Date().toLocaleString()}\\line
}`;
            await fs.writeFile(filePath, rtfContent);

        } else if (file_extension === 'odt') {
            // Basic fallback: save plain content with .odt extension
            const odtContent =
                `REPORT: ${title}\n` +
                `Task Type: ${task_type}\n` +
                `Status: ${task_status}\n` +
                `Description: ${description}\n` +
                `Signature: ${signature}\n` +
                `Generated: ${new Date().toLocaleString()}`;
            await fs.writeFile(filePath, odtContent);

        } else {
            return res.status(400).json({ message: 'Unsupported file extension' });
        }

        // Get file size
        const stats = await fs.stat(filePath);
        const file_size = stats.size;

        // Save metadata in DB
        const sql = `
            INSERT INTO report 
            (title, task_type, task_status, description, file_extension, file_name, file_path, file_size, signature, customer_id, project_id, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            title,
            task_type,
            task_status,
            description,
            file_extension,
            fileName,
            filePath,
            file_size,
            signature,
            customer_id || null,
            project_id || null,
            created_by || null
        ]);

        res.status(201).json({
            report_id: result.insertId,
            message: 'Report generated and saved successfully',
            fileName
        });

    } catch (err) {
        console.error('Error generating report:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ----------------------------
// View all reports
// ----------------------------
const viewreports = async (req, res) => {
    try {
        const sql = 'SELECT * FROM report ORDER BY created_at DESC';
        const [rows] = await db.execute(sql);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching reports:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ----------------------------
// Download a report by ID
// ----------------------------
const downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM report WHERE report_id = ?';
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        const report = rows[0];
        const filePath = report.file_path || path.join(reportsDir, report.file_name);
        
        try {
            await fs.access(filePath);
            res.download(filePath, report.file_name);
        } catch (err) {
            return res.status(404).json({ message: 'Report file not found' });
        }
    } catch (err) {
        console.error('Error downloading report:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ----------------------------
// Get all customers
// ----------------------------
const getCustomers = async (req, res) => {
    try {
        const sql = 'SELECT id, username FROM customers';
        const [rows] = await db.execute(sql);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching customers:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ----------------------------
// Get all projects
// ----------------------------
const getProjects = async (req, res) => {
    try {
        const sql = 'SELECT id, title FROM projects';
        const [rows] = await db.execute(sql);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const sqlSelect = 'SELECT * FROM report WHERE report_id = ?';
        const [rows] = await db.execute(sqlSelect, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const report = rows[0];
        const filePath = report.file_path || path.join(reportsDir, report.file_name);

        // Attempt to remove file if it exists
        try {
            await fs.unlink(filePath).catch(() => null);
        } catch (e) {
            // ignore file unlink errors
        }

        const sqlDelete = 'DELETE FROM report WHERE report_id = ?';
        await db.execute(sqlDelete, [id]);

        return res.status(200).json({ success: true, message: 'Report deleted' });
    } catch (err) {
        console.error('Error deleting report:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createReport,
    viewreports,
    downloadReport,
    getCustomers,
    getProjects,
    deleteReport
};
