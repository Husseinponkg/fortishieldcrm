#!/usr/bin/env python3
"""
Script to retrain the customer service classification model.
This script is meant to be called by the Node.js application when new customer data is added.
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
from scipy.sparse import hstack, csr_matrix
import pickle
import json
import sys
import os
from datetime import datetime
import warnings

# Suppress warnings for small datasets
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure trainer directory exists
os.makedirs('trainer', exist_ok=True)

# Add parent directory to sys.path for db_config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..config.db_config import get_db_connection
except ImportError:
    # Fallback if db_config is missing
    def get_db_connection():
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'A002#tz1'),
            database=os.getenv('DB_NAME', 'crm')
        )

def fetch_customer_data():
    """Fetch customer data from the database"""
    try:
        connection = get_db_connection()
        query = "SELECT id, username, email, contacts, service, details, created_at FROM customers"
        df = pd.read_sql(query, connection)
        connection.close()
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def preprocess_data(df):
    """Preprocess the data for training"""
    print(f"Original data shape: {df.shape}")

    # Remove rows with missing details
    df = df.dropna(subset=['details'])
    print(f"Data shape after removing missing details: {df.shape}")

    # Fill missing service values
    df['service'] = df['service'].fillna('Unknown')

    # Remove rows with empty details
    df = df[df['details'].str.strip().str.len() > 0]
    print(f"Data shape after removing empty details: {df.shape}")

    # Check if we have enough data
    if len(df) < 2:
        print("Not enough data for training")
        return None, None

    # Check number of unique classes
    unique_services = df['service'].nunique()
    print(f"Number of unique services: {unique_services}")
    if unique_services < 2:
        print("Not enough unique services for classification")
        return None, None

    # Encode service labels
    label_encoder = LabelEncoder()
    df['service_encoded'] = label_encoder.fit_transform(df['service'])

    # Preprocess details: lowercase and strip
    df['details'] = df['details'].str.lower().str.strip()

    return df, label_encoder

def train_model():
    """Train the machine learning model"""
    print("Fetching customer data...")
    df = fetch_customer_data()
    if df is None or len(df) < 2:
        print("Not enough data to train the model")
        return None

    print(f"Fetched {len(df)} records from database")
    df, label_encoder = preprocess_data(df)
    if df is None or len(df) < 2:
        print("Not enough data after preprocessing")
        return None

    print(f"Data shape after preprocessing: {df.shape}")
    print(f"Service distribution:\n{df['service'].value_counts()}")

    # Vectorize text data
    vectorizer = TfidfVectorizer(max_features=100, stop_words='english', min_df=1, max_df=0.95)
    X_text = vectorizer.fit_transform(df['details'])
    print(f"Text features shape: {X_text.shape}")

    # Numeric features
    X_numeric = df[['contacts']].astype(float).values
    X_numeric_sparse = csr_matrix(X_numeric)
    X = hstack([X_text, X_numeric_sparse])
    print(f"Combined features shape: {X.shape}")

    y = df['service_encoded']

    # Split data
    if len(df) < 5:
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        from collections import Counter
        class_counts = Counter(y)
        min_class_count = min(class_counts.values())
        if min_class_count < 2:
            print("Warning: Some classes have fewer than 2 samples. Using regular split without stratification.")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        else:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")

    # Train model
    model = RandomForestClassifier(
        n_estimators=10,
        max_depth=5,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    if X_test.shape[0] > 0 and not np.array_equal(X_train.toarray(), X_test.toarray()):
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model Accuracy: {accuracy}")
        unique_test_labels = np.unique(y_test)
        filtered_target_names = [label_encoder.classes_[i] for i in unique_test_labels]
        print("Classification Report:")
        print(classification_report(y_test, y_pred, labels=unique_test_labels, target_names=filtered_target_names))
    else:
        y_pred = model.predict(X_train)
        accuracy = accuracy_score(y_train, y_pred)
        print(f"Model Accuracy (on training data): {accuracy}")

    # Save model
    try:
        model_data = {
            'model': model,
            'vectorizer': vectorizer,
            'label_encoder': label_encoder
        }
        with open('trainer/customerrands.pkl', 'wb') as f:
            pickle.dump(model_data, f)
        print("Model saved as trainer/customerrands.pkl")
        return model_data
    except Exception as e:
        print(f"Error saving model: {e}")
        return None

def generate_trends_stats():
    """Generate trends statistics from the customer data"""
    print("Generating trends statistics...")
    try:
        connection = get_db_connection()
        query = "SELECT id, username, email, contacts, service, details, created_at FROM customers"
        df = pd.read_sql(query, connection)
        connection.close()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

    if df is None or len(df) < 1:
        print("Not enough data to generate trends")
        return None

    print(f"Fetched {len(df)} records from database")

    # Service distribution
    service_distribution = df['service'].value_counts().reset_index()
    service_distribution.columns = ['service', 'count']

    # Customer growth
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['month'] = df['created_at'].dt.to_period('M').astype(str)
    monthly_growth = df.groupby('month').size().reset_index(name='count')
    monthly_growth.columns = ['date', 'count']
    monthly_growth = monthly_growth.sort_values('date')
    monthly_growth['cumulative_count'] = monthly_growth['count'].cumsum()
    customer_growth = monthly_growth.to_dict('records')

    # Service growth
    service_growth = df.groupby(['month', 'service']).size().reset_index(name='count')
    service_growth.columns = ['date', 'service', 'count']
    service_growth = service_growth.sort_values(['date', 'service'])

    # Top services
    top_services = df['service'].value_counts().head(5).reset_index()
    top_services.columns = ['service', 'count']

    trends_data = {
        'serviceDistribution': service_distribution.to_dict('records'),
        'customerGrowth': customer_growth,
        'serviceGrowth': service_growth.to_dict('records'),
        'topServices': top_services.to_dict('records')
    }

    # Save trends
    try:
        with open('trainer/trends.json', 'w') as f:
            json.dump(trends_data, f, indent=2)
        print("Trends data saved as trainer/trends.json")
    except Exception as e:
        print(f"Error saving trends data: {e}")

    return trends_data

def main():
    """Main function to retrain the model and generate trends"""
    print("Starting model retraining and trends generation...")
    model_result = train_model()
    trends_result = generate_trends_stats()

    if model_result is not None and trends_result is not None:
        print("Model retraining and trends generation completed successfully!")
        return True
    else:
        print("Model retraining or trends generation failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
