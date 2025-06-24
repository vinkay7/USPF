#!/usr/bin/env python3
import requests
import json
import os
import unittest
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

class AuthenticationTest(unittest.TestCase):
    """Test suite for authentication endpoints"""
    
    def test_01_login_success(self):
        """Test successful login with admin credentials"""
        login_data = {
            "username": "admin",
            "password": "admin"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        data = response.json()
        self.assertTrue(data.get("success"), "Login should be successful")
        self.assertIsNotNone(data.get("token"), "Token should be returned")
        self.assertEqual(data.get("user").get("username"), "admin", "Username should be 'admin'")
        self.assertEqual(data.get("user").get("role"), "admin", "Role should be 'admin'")
        
        # Save token for other tests
        self.token = data.get("token")
        print(f"✅ Login successful with admin/admin credentials")
        
    def test_02_login_failure(self):
        """Test login failure with incorrect credentials"""
        login_data = {
            "username": "admin",
            "password": "wrong_password"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        print(f"✅ Login correctly fails with wrong credentials")
        
    def test_03_get_current_user(self):
        """Test getting current user info with valid token"""
        # Make sure we have a token from the login test
        if not hasattr(self, 'token'):
            self.test_01_login_success()
            
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        user_data = response.json()
        self.assertEqual(user_data.get("username"), "admin", "Username should be 'admin'")
        self.assertEqual(user_data.get("role"), "admin", "Role should be 'admin'")
        print(f"✅ Successfully retrieved user info with token")
        
    def test_04_unauthorized_access(self):
        """Test unauthorized access to protected endpoint"""
        # No authorization header
        response = requests.get(f"{API_URL}/auth/me")
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        
        # Invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        print(f"✅ Protected endpoints correctly reject unauthorized access")
        
    def test_05_token_format(self):
        """Test token format and structure"""
        # Make sure we have a token from the login test
        if not hasattr(self, 'token'):
            self.test_01_login_success()
            
        # For this simple implementation, we're just checking that the token is a non-empty string
        # In a real JWT implementation, we would validate the token structure
        self.assertIsInstance(self.token, str, "Token should be a string")
        self.assertTrue(len(self.token) > 0, "Token should not be empty")
        print(f"✅ Token has correct format")

if __name__ == "__main__":
    unittest.main(verbosity=2)