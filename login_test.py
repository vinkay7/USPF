#!/usr/bin/env python3
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from frontend/.env to get the backend URL
load_dotenv("frontend/.env")

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    exit(1)

# Add /api prefix for all API endpoints
API_URL = f"{BACKEND_URL}/api"
print(f"Testing API at: {API_URL}")

def test_login():
    """Test login endpoint with admin credentials"""
    print("\n1. Testing POST /api/auth/login with admin/admin credentials...")
    
    login_data = {
        "username": "admin",
        "password": "admin"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print(f"Response: {json.dumps(login_response, indent=2)}")
            
            # Check if response contains success and token
            if login_response.get("success") and login_response.get("token"):
                print("✅ Login successful! Token received.")
                return login_response.get("token")
            else:
                print("❌ Login failed: Response doesn't contain success=true or token")
                return None
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_current_user(token):
    """Test /api/auth/me endpoint with token"""
    print("\n2. Testing GET /api/auth/me with the received token...")
    
    if not token:
        print("❌ Cannot test /api/auth/me: No token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"Response: {json.dumps(user_data, indent=2)}")
            
            # Verify user data
            if user_data.get("username") == "admin" and user_data.get("role") == "admin":
                print("✅ User verification successful! Authenticated as admin.")
                return True
            else:
                print("❌ User verification failed: Not authenticated as admin")
                return False
        else:
            print(f"❌ User verification failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during user verification: {str(e)}")
        return False

def main():
    print("=== USPF Inventory Management System - Authentication Test ===")
    
    # Test login
    token = test_login()
    
    # Test current user endpoint
    if token:
        user_verified = test_current_user(token)
    else:
        user_verified = False
    
    # Print summary
    print("\n=== Test Summary ===")
    if token and user_verified:
        print("✅ Authentication system is working correctly!")
        print("✅ Successfully logged in with admin/admin credentials")
        print("✅ Successfully verified user identity with token")
    else:
        print("❌ Authentication system has issues:")
        if not token:
            print("  - Login with admin/admin credentials failed")
        if not user_verified and token:
            print("  - User verification with token failed")

if __name__ == "__main__":
    main()