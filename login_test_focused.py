#!/usr/bin/env python3
import requests
import json
import sys
import os
import jwt
from dotenv import load_dotenv

# Load environment variables from frontend/.env to get the backend URL
load_dotenv("frontend/.env")

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Add /api prefix for all API endpoints
API_URL = f"{BACKEND_URL}/api"
print(f"Testing login API at: {API_URL}")

def test_login_endpoint():
    """Test POST /api/auth/login endpoint with uspf/uspf credentials"""
    print("\n1. Testing POST /api/auth/login with uspf/uspf credentials...")
    
    login_data = {
        "username": "uspf",
        "password": "uspf"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print(f"Response: {json.dumps(login_response, indent=2)}")
            
            # Check if response contains success and tokens
            if login_response.get("success") and login_response.get("access_token") and login_response.get("refresh_token"):
                print("✅ Login successful! JWT tokens received.")
                
                # Verify JWT token structure
                try:
                    # Decode without verification to check payload structure
                    decoded_token = jwt.decode(login_response.get("access_token"), options={"verify_signature": False})
                    print("\nAccess Token Contents:")
                    print(f"Subject (sub): {decoded_token.get('sub')}")
                    print(f"Role: {decoded_token.get('role')}")
                    print(f"Token type: {decoded_token.get('type')}")
                    print(f"Expiration: {decoded_token.get('exp')}")
                    
                    if decoded_token.get("sub") == "uspf" and decoded_token.get("role") == "admin" and decoded_token.get("type") == "access":
                        print("✅ JWT token structure verified successfully")
                    else:
                        print("❌ JWT token structure verification failed")
                except Exception as e:
                    print(f"❌ Failed to decode JWT token: {str(e)}")
                
                return True, login_response.get("access_token"), login_response.get("refresh_token")
            else:
                print("❌ Login failed: Response doesn't contain success=true or tokens")
                return False, None, None
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False, None, None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return False, None, None

def test_invalid_login():
    """Test POST /api/auth/login with invalid credentials"""
    print("\n2. Testing POST /api/auth/login with invalid credentials...")
    
    login_data = {
        "username": "invalid",
        "password": "invalid"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Invalid credentials properly rejected with 401 Unauthorized")
            try:
                error_response = response.json()
                print(f"Error message: {error_response.get('detail')}")
            except:
                print("No JSON response body")
            return True
        else:
            print(f"❌ Expected 401 status code, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing invalid credentials: {str(e)}")
        return False

def test_auth_me_endpoint(access_token):
    """Test GET /api/auth/me endpoint to verify token validation"""
    print("\n3. Testing GET /api/auth/me endpoint to verify token validation...")
    
    if not access_token:
        print("❌ Cannot test /api/auth/me: No token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"Response: {json.dumps(user_data, indent=2)}")
            
            # Verify user data
            if user_data.get("username") == "uspf" and user_data.get("role") == "admin":
                print("✅ Token validation successful! Authenticated as uspf admin.")
                return True
            else:
                print("❌ Token validation failed: Not authenticated as uspf admin")
                return False
        else:
            print(f"❌ Token validation failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during token validation: {str(e)}")
        return False

def test_invalid_token():
    """Test GET /api/auth/me with invalid token"""
    print("\n4. Testing GET /api/auth/me with invalid token...")
    
    try:
        headers = {"Authorization": "Bearer invalid.token.format"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Invalid token properly rejected with 401 Unauthorized")
            try:
                error_response = response.json()
                print(f"Error message: {error_response.get('detail')}")
            except:
                print("No JSON response body")
            return True
        else:
            print(f"❌ Expected 401 status code, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing invalid token: {str(e)}")
        return False

def main():
    print("=== USPF Inventory Management System - Login Test ===")
    
    # Test login endpoint
    login_success, access_token, refresh_token = test_login_endpoint()
    
    # Test invalid login
    invalid_login_success = test_invalid_login()
    
    # Test auth/me endpoint
    if access_token:
        auth_me_success = test_auth_me_endpoint(access_token)
    else:
        auth_me_success = False
    
    # Test invalid token
    invalid_token_success = test_invalid_token()
    
    # Print summary
    print("\n=== Login Test Summary ===")
    all_tests_passed = login_success and invalid_login_success and auth_me_success and invalid_token_success
    
    if all_tests_passed:
        print("✅ All login tests passed successfully!")
        print("✅ Login with uspf/uspf credentials works correctly")
        print("✅ Login returns proper JWT tokens")
        print("✅ Invalid credentials are properly rejected")
        print("✅ GET /api/auth/me endpoint verifies token validation")
        print("✅ Invalid tokens are properly rejected")
    else:
        print("❌ Some login tests failed:")
        if not login_success:
            print("  - Login with uspf/uspf credentials failed")
        if not invalid_login_success:
            print("  - Invalid credentials test failed")
        if not auth_me_success:
            print("  - GET /api/auth/me endpoint test failed")
        if not invalid_token_success:
            print("  - Invalid token test failed")

if __name__ == "__main__":
    main()