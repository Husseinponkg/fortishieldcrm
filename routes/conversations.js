const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all conversations
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT c.*, cu.username as customer_name 
            FROM conversations c 
            LEFT JOIN customers cu ON c.customer_id = cu.id
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
});

// Get conversations by customer ID
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const [rows] = await db.execute(`
            SELECT * FROM conversations 
            WHERE customer_id = ? 
            ORDER BY created_at ASC
        `, [customerId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
});

// Create a new conversation message
router.post('/', async (req, res) => {
    try {
        const { customer_id, message, sender, notification } = req.body;
        
        const [result] = await db.execute(`
            INSERT INTO conversations (customer_id, message, sender, notification, status)
            VALUES (?, ?, ?, ?, ?)
        `, [customer_id, message, sender, notification || 0, 'sent']);
        
        // Get the created message with timestamp
        const [rows] = await db.execute(`
            SELECT c.*, cu.username as customer_name
            FROM conversations c
            LEFT JOIN customers cu ON c.customer_id = cu.id
            WHERE c.id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            message: 'Conversation message created successfully',
            conversation: rows[0],
            conversationId: result.insertId
        });
    } catch (error) {
        console.error('Error creating conversation message:', error);
        res.status(500).json({
            message: 'Error creating conversation message',
            error: error.message
        });
    }
});

// Update notification status
router.put('/notification/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { notification } = req.body;
        
        await db.execute(`
            UPDATE conversations
            SET notification = ?
            WHERE id = ?
        `, [notification, id]);
        
        res.status(200).json({ message: 'Notification status updated successfully' });
    } catch (error) {
        console.error('Error updating notification status:', error);
        res.status(500).json({
            message: 'Error updating notification status',
            error: error.message
        });
    }
});

// Update message status
router.put('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        if (!['sent', 'delivered', 'read'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        
        await db.execute(`
            UPDATE conversations
            SET status = ?
            WHERE id = ?
        `, [status, id]);
        
        res.status(200).json({ message: 'Message status updated successfully' });
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({
            message: 'Error updating message status',
            error: error.message
        });
    }
});

// Archive a conversation
router.put('/archive/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { archived } = req.body;
        
        await db.execute(`
            UPDATE conversations
            SET archived = ?
            WHERE id = ?
        `, [archived ? 1 : 0, id]);
        
        res.status(200).json({ message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully` });
    } catch (error) {
        console.error('Error archiving conversation:', error);
        res.status(500).json({
            message: 'Error archiving conversation',
            error: error.message
        });
    }
});

// Get conversation statistics
router.get('/statistics', async (req, res) => {
    try {
        // Get total conversations
        const [totalConversations] = await db.execute(`
            SELECT COUNT(*) as total FROM conversations
        `);
        
        // Get unread messages
        const [unreadMessages] = await db.execute(`
            SELECT COUNT(*) as unread FROM conversations WHERE notification = 1
        `);
        
        // Get messages by sender type
        const [messagesBySender] = await db.execute(`
            SELECT sender, COUNT(*) as count FROM conversations GROUP BY sender
        `);
        
        // Get recent conversations (last 7 days)
        const [recentConversations] = await db.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM conversations
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        
        // Get message status distribution
        const [statusDistribution] = await db.execute(`
            SELECT status, COUNT(*) as count FROM conversations GROUP BY status
        `);
        
        // Get archived conversations count
        const [archivedConversations] = await db.execute(`
            SELECT COUNT(*) as archived FROM conversations WHERE archived = 1
        `);
        
        res.status(200).json({
            totalConversations: totalConversations[0].total,
            unreadMessages: unreadMessages[0].unread,
            messagesBySender: messagesBySender,
            recentConversations: recentConversations,
            statusDistribution: statusDistribution,
            archivedConversations: archivedConversations[0].archived
        });
    } catch (error) {
        console.error('Error fetching conversation statistics:', error);
        res.status(500).json({
            message: 'Error fetching conversation statistics',
            error: error.message
        });
    }
});

module.exports = router;