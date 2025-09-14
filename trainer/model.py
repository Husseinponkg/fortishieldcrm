import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle
from sqlalchemy import create_engine
from sklearn.preprocessing import LabelEncoder
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create a database connection using SQLAlchemy"""
    try:
        # Create connection string
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', 3306)
        user = os.getenv('DB_USER', 'root')
        password = os.getenv('DB_PASSWORD', 'A002#tz1')
        database = os.getenv('DB_NAME', 'crm')
        
        # Create SQLAlchemy engine
        connection_string = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"
        engine = create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"Error creating database engine: {e}")
        return None

def fetch_customer_data():
    """Fetch customer data from the database"""
    engine = get_db_connection()
    if not engine:
        return None
    
    try:
        query = "SELECT id, username, email, contacts, service, details FROM customers"
        df = pd.read_sql(query, engine)
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
    
    # Fill missing values
    df['service'] = df['service'].fillna('Unknown')
    
    # Remove rows with empty details
    df = df[df['details'].str.len() > 0]
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
    
    # Encode the service labels
    label_encoder = LabelEncoder()
    df['service_encoded'] = label_encoder.fit_transform(df['service'])
    
    return df, label_encoder

def train_model():
    """Train the machine learning model"""
    print("Fetching customer data...")
    # Fetch data from database
    df = fetch_customer_data()
    if df is None or len(df) < 2:
        print("Not enough data to train the model")
        return None
    
    print(f"Fetched {len(df)} records from database")
    
    # Preprocess data
    df, label_encoder = preprocess_data(df)
    
    if df is None or len(df) < 2:
        print("Not enough data after preprocessing")
        return None
    
    print(f"Data shape after preprocessing: {df.shape}")
    print(f"Service distribution:\n{df['service'].value_counts()}")
    
    # Vectorize the text data
    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english', min_df=1, max_df=0.95)
    X_text = vectorizer.fit_transform(df['details'])
    print(f"Text features shape: {X_text.shape}")
    
    # Use other features as well
    X_numeric = df[['contacts']].values
    print(f"Numeric features shape: {X_numeric.shape}")
    
    # Combine text and numeric features
    from scipy.sparse import hstack
    X = hstack([X_text, X_numeric])
    print(f"Combined features shape: {X.shape}")
    
    y = df['service_encoded']
    print(f"Target shape: {y.shape}")
    print(f"Unique classes in target: {np.unique(y)}")
    
    # Handle case where there's only one class
    if len(np.unique(y)) < 2:
        print("Not enough classes for training")
        return None
    
    # Check if we have enough samples for train/test split
    if len(df) < 5:
        print("Using all data for training (small dataset)")
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        # Check if we have enough samples per class for stratification
        from collections import Counter
        class_counts = Counter(y)
        min_class_count = min(class_counts.values())
        
        # If the least populated class has fewer than 2 samples, we can't use stratification
        if min_class_count < 2:
            print("Warning: Some classes have fewer than 2 samples. Using regular split without stratification.")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        else:
            # Split the data with stratification
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Train the model
    model = RandomForestClassifier(n_estimators=100, random_state=42, min_samples_split=2, min_samples_leaf=1)
    model.fit(X_train, y_train)
    
    # Evaluate the model
    if X_test.shape[0] > 0 and not np.array_equal(X_train.toarray(), X_test.toarray()):
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model Accuracy: {accuracy}")
        
        # Print detailed classification report
        target_names = label_encoder.classes_
        # Only include classes that are present in the test set
        unique_test_labels = np.unique(y_test)
        filtered_target_names = [target_names[i] for i in unique_test_labels]
        print("Classification Report:")
        print(classification_report(y_test, y_pred, target_names=filtered_target_names))
    else:
        # If we're using the same data for training and testing
        y_pred = model.predict(X_train)
        accuracy = accuracy_score(y_train, y_pred)
        print(f"Model Accuracy (on training data): {accuracy}")
    
    # Save the model and vectorizer
    try:
        with open('trainer/customerrands.pkl', 'wb') as f:
            pickle.dump({
                'model': model,
                'vectorizer': vectorizer,
                'label_encoder': label_encoder
            }, f)
        
        print("Model saved as trainer/customerrands.pkl")
        return model
    except Exception as e:
        print(f"Error saving model: {e}")
        return None

def predict_service(details, contacts=0):
    """Predict service category based on customer details"""
    # Load the model
    if not os.path.exists('trainer/customerrands.pkl'):
        print("Model file not found. Please train the model first.")
        return None
    
    try:
        with open('trainer/customerrands.pkl', 'rb') as f:
            saved_objects = pickle.load(f)
            model = saved_objects['model']
            vectorizer = saved_objects['vectorizer']
            label_encoder = saved_objects['label_encoder']
    except Exception as e:
        print(f"Error loading model: {e}")
        return None
    
    # Vectorize the input
    X_text = vectorizer.transform([details])
    X_numeric = np.array([[contacts]])
    
    # Combine features
    from scipy.sparse import hstack
    X = hstack([X_text, X_numeric])
    
    # Make prediction
    prediction = model.predict(X)
    predicted_service = label_encoder.inverse_transform(prediction)
    
    # Get prediction probability
    probabilities = model.predict_proba(X)
    confidence = np.max(probabilities)
    
    return {
        'predicted_service': predicted_service[0],
        'confidence': confidence
    }

def train_and_save_model():
    """Train the model and save it"""
    print("Training model...")
    result = train_model()
    if result is not None:
        print("Model training completed successfully!")
        return True
    else:
        print("Model training failed.")
        return False

if __name__ == "__main__":
    # Train and save the model
    train_and_save_model()