#!/usr/bin/env python3
"""
Script to add test data to the CRM database.
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create a database connection using environment variables"""
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'A002#tz1'),
        database=os.getenv('DB_NAME', 'crm'),
        port=int(os.getenv('DB_PORT', 3306))
    )

def add_test_data():
    """Add test customer data to the database"""
    try:
        # Create database connection
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Test data for customers
        customers = [
            ('John Doe', 1, 'john@example.com', '123456789', 'Web Development', 'Looking for a website redesign'),
            ('Jane Smith', 1, 'jane@example.com', '987654321', 'Mobile App', 'Need a mobile app for my business'),
            ('Bob Johnson', 1, 'bob@example.com', '555555', 'Web Development', 'E-commerce website needed'),
            ('Alice Brown', 1, 'alice@example.com', '1111', 'Consulting', 'Business process optimization'),
            ('Charlie Wilson', 1, 'charlie@example.com', '22222222', 'Mobile App', 'iOS app development'),
            ('Diana Davis', 1, 'diana@example.com', '333333', 'Web Development', 'Corporate website design'),
            ('Eve Miller', 1, 'eve@example.com', '4444444', 'Consulting', 'Market research and analysis')
        ]
        
        # Insert test data
        sql = "INSERT INTO customers(username, user_id, email, contacts, service, details) VALUES (%s, %s, %s, %s, %s, %s)"
        
        for customer in customers:
            cursor.execute(sql, customer)
            print(f"Added customer: {customer[0]}")
        
        # Commit changes
        connection.commit()
        print("Test data added successfully!")
        
        # Close connection
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error adding test data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = add_test_data()
    exit(0 if success else 1)