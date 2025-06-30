#!/usr/bin/env python3
import requests
import json
import os
import unittest
import jwt
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
        """Test successful login with uspf credentials"""
        login_data = {
            "username": "uspf",
            "password": "uspf"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        data = response.json()
        self.assertTrue(data.get("success"), "Login should be successful")
        self.assertIsNotNone(data.get("access_token"), "Access token should be returned")
        self.assertIsNotNone(data.get("refresh_token"), "Refresh token should be returned")
        self.assertEqual(data.get("user").get("username"), "uspf", "Username should be 'uspf'")
        self.assertEqual(data.get("user").get("role"), "admin", "Role should be 'admin'")
        
        # Save tokens for other tests
        self.access_token = data.get("access_token")
        self.refresh_token = data.get("refresh_token")
        
        # Verify JWT token structure
        decoded_token = jwt.decode(self.access_token, options={"verify_signature": False})
        self.assertEqual(decoded_token.get("sub"), "uspf", "Token subject should be 'uspf'")
        self.assertEqual(decoded_token.get("role"), "admin", "Token role should be 'admin'")
        self.assertEqual(decoded_token.get("type"), "access", "Token type should be 'access'")
        self.assertIn("exp", decoded_token, "Token should have expiration time")
        
        print(f"✅ Login successful with uspf/uspf credentials")
        
    def test_02_login_failure(self):
        """Test login failure with incorrect credentials"""
        login_data = {
            "username": "uspf",
            "password": "wrong_password"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        print(f"✅ Login correctly fails with wrong credentials")
        
    def test_03_get_current_user(self):
        """Test getting current user info with valid token"""
        # Make sure we have a token from the login test
        if not hasattr(self, 'access_token'):
            self.test_01_login_success()
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        user_data = response.json()
        self.assertEqual(user_data.get("username"), "uspf", "Username should be 'uspf'")
        self.assertEqual(user_data.get("role"), "admin", "Role should be 'admin'")
        print(f"✅ Successfully retrieved user info with token")
        
    def test_04_token_refresh(self):
        """Test refreshing access token with refresh token"""
        # Make sure we have a refresh token from the login test
        if not hasattr(self, 'refresh_token'):
            self.test_01_login_success()
            
        refresh_data = {
            "refresh_token": self.refresh_token
        }
        
        response = requests.post(f"{API_URL}/auth/refresh", json=refresh_data)
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        data = response.json()
        self.assertIsNotNone(data.get("access_token"), "New access token should be returned")
        self.assertEqual(data.get("token_type"), "bearer", "Token type should be 'bearer'")
        self.assertIsNotNone(data.get("expires_in"), "Token expiration should be returned")
        
        # Save new access token
        new_access_token = data.get("access_token")
        
        # Verify the new token works
        headers = {"Authorization": f"Bearer {new_access_token}"}
        me_response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(me_response.status_code, 200, "New token should be valid for authentication")
        
        print(f"✅ Successfully refreshed access token")
        
    def test_05_unauthorized_access(self):
        """Test unauthorized access to protected endpoint"""
        # No authorization header
        response = requests.get(f"{API_URL}/auth/me")
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        
        # Invalid token
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401, f"Expected status code 401, got {response.status_code}")
        print(f"✅ Protected endpoints correctly reject unauthorized access")
        
    def test_06_protected_endpoints(self):
        """Test access to protected endpoints with valid token"""
        # Make sure we have a token from the login test
        if not hasattr(self, 'access_token'):
            self.test_01_login_success()
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Test inventory endpoint
        inventory_response = requests.get(f"{API_URL}/inventory", headers=headers)
        self.assertEqual(inventory_response.status_code, 200, 
                        f"Expected status code 200 for inventory endpoint, got {inventory_response.status_code}")
        
        # Test dashboard stats endpoint
        stats_response = requests.get(f"{API_URL}/dashboard/stats", headers=headers)
        self.assertEqual(stats_response.status_code, 200, 
                        f"Expected status code 200 for dashboard stats endpoint, got {stats_response.status_code}")
        
        print(f"✅ Successfully accessed protected endpoints with valid token")

if __name__ == "__main__":
    unittest.main(verbosity=2)