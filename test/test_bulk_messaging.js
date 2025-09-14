const express = require('express');
const db = require('../config/db');

async function testBulkMessaging() {
    try {
        console.log('Testing bulk messaging functionality...');
        
        // Test 1: Get all customers
        console.log('\n1. Fetching all customers...');
        const [customers] = await db.execute('SELECT id, username FROM customers');
        console.log(`Found ${customers.length} customers`);
        
        if (customers.length > 0) {
            console.log('First 3 customers:');
            customers.slice(0, 3).forEach(customer => {
                console.log(`  - ${customer.username} (ID: ${customer.id})`);
            });
        }
        
        // Test 2: Get templates
        console.log('\n2. Fetching message templates...');
        const [templates] = await db.execute('SELECT id, name, template, category FROM templates');
        console.log(`Found ${templates.length} templates`);
        
        if (templates.length > 0) {
            console.log('Templates:');
            templates.forEach(template => {
                console.log(`  - ${template.name} (${template.category}): ${template.template.substring(0, 50)}...`);
            });
        }
        
        // Test 3: Send test message to first customer
        if (customers.length > 0) {
            console.log('\n3. Sending test message to first customer...');
            const firstCustomer = customers[0];
            
            // Check if conversation exists
            const [existingConv] = await db.execute(
                'SELECT id FROM conversations WHERE customer_id = ? LIMIT 1', 
                [firstCustomer.id]
            );
            
            let messageId;
            if (existingConv.length === 0) {
                // Create new conversation
                const [result] = await db.execute(
                    'INSERT INTO conversations (customer_id, message, sender, notification) VALUES (?, ?, ?, ?)',
                    [firstCustomer.id, `Welcome ${firstCustomer.username}! This is a test message from Fortishield.`, 'system', 1]
                );
                messageId = result.insertId;
            } else {
                // Add to existing conversation
                const [result] = await db.execute(
                    'INSERT INTO conversations (customer_id, message, sender, notification) VALUES (?, ?, ?, ?)',
                    [firstCustomer.id, 'This is another test message from Fortishield.', 'system', 1]
                );
                messageId = result.insertId;
            }
            
            console.log(`Message sent successfully! Message ID: ${messageId}`);
            
            // Verify message was saved
            const [savedMessage] = await db.execute(
                'SELECT * FROM conversations WHERE id = ?', 
                [messageId]
            );
            
            if (savedMessage.length > 0) {
                console.log('Message saved correctly:');
                console.log(`  Customer ID: ${savedMessage[0].customer_id}`);
                console.log(`  Message: ${savedMessage[0].message}`);
                console.log(`  Sender: ${savedMessage[0].sender}`);
                console.log(`  Notification: ${savedMessage[0].notification}`);
            }
        }
        
        console.log('\nBulk messaging test completed successfully!');
        
    } catch (error) {
        console.error('Error during bulk messaging test:', error);
    } finally {
        process.exit(0);
    }
}

// Run the test
testBulkMessaging();