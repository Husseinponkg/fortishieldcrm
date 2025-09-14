const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDatabase() {
  try {
    console.log('Initializing database with schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement !== '') {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
        await db.execute(trimmedStatement);
      }
    }
    
    // Initialize templates
    console.log('Initializing templates...');
    const templatesPath = path.join(__dirname, '../models/init_templates.sql');
    const templates = fs.readFileSync(templatesPath, 'utf8');
    const templateStatements = templates.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of templateStatements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement !== '') {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
        await db.execute(trimmedStatement);
      }
    }
    
    // Initialize sample data
    console.log('Initializing sample data...');
    const sampleDataPath = path.join(__dirname, '../models/sample_data.sql');
    const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
    const sampleDataStatements = sampleData.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of sampleDataStatements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement !== '') {
        try {
          console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
          await db.execute(trimmedStatement);
        } catch (error) {
          console.log('Note: Statement may have already been executed or constraint issue -', error.message.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();