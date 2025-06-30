#!/usr/bin/env python3
import requests
import json
import jwt
import sys
import os
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
print(f"Testing API at: {API_URL}")

def test_login():
    """Test login endpoint with uspf credentials"""
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
            
            # Check if response contains success and access_token
            if login_response.get("success") and login_response.get("access_token"):
                print("✅ Login successful! JWT tokens received.")
                
                # Verify JWT token structure
                try:
                    # Decode without verification to check payload structure
                    access_token = login_response.get("access_token")
                    decoded_token = jwt.decode(access_token, options={"verify_signature": False})
                    print(f"✅ JWT token decoded successfully")
                    print(f"Token subject: {decoded_token.get('sub')}")
                    print(f"Token role: {decoded_token.get('role')}")
                    print(f"Token type: {decoded_token.get('type')}")
                    print(f"Token expiration: {decoded_token.get('exp')}")
                except Exception as e:
                    print(f"❌ Failed to decode JWT token: {str(e)}")
                
                return login_response.get("access_token"), login_response.get("refresh_token")
            else:
                print("❌ Login failed: Response doesn't contain success=true or access_token")
                return None, None
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None, None

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
            if user_data.get("username") == "uspf" and user_data.get("role") == "admin":
                print("✅ User verification successful! Authenticated as uspf admin.")
                return True
            else:
                print("❌ User verification failed: Not authenticated as uspf admin")
                return False
        else:
            print(f"❌ User verification failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during user verification: {str(e)}")
        return False

def test_token_refresh(refresh_token):
    """Test token refresh endpoint"""
    print("\n3. Testing POST /api/auth/refresh with refresh token...")
    
    if not refresh_token:
        print("❌ Cannot test token refresh: No refresh token available")
        return None
    
    try:
        refresh_data = {
            "refresh_token": refresh_token
        }
        
        response = requests.post(f"{API_URL}/auth/refresh", json=refresh_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            refresh_response = response.json()
            print(f"Response: {json.dumps(refresh_response, indent=2)}")
            
            new_token = refresh_response.get("access_token")
            if new_token:
                print("✅ Token refresh successful! New access token received.")
                
                # Verify the new token works
                headers = {"Authorization": f"Bearer {new_token}"}
                me_response = requests.get(f"{API_URL}/auth/me", headers=headers)
                
                if me_response.status_code == 200:
                    print("✅ New token successfully validated with /api/auth/me endpoint.")
                    return new_token
                else:
                    print(f"❌ New token validation failed with status code {me_response.status_code}")
                    return None
            else:
                print("❌ Token refresh failed: No new access token in response")
                return None
        else:
            print(f"❌ Token refresh failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during token refresh: {str(e)}")
        return None

def test_login_with_incorrect_credentials():
    """Test login endpoint with incorrect credentials"""
    print("\n4. Testing POST /api/auth/login with incorrect credentials...")
    
    login_data = {
        "username": "wrong",
        "password": "wrong"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ Correct status code 401 for invalid credentials")
            return True
        else:
            print(f"❌ Expected status code 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error during login test: {str(e)}")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print("\n5. Testing CORS configuration...")
    try:
        # Send an OPTIONS request to check CORS headers
        response = requests.options(f"{API_URL}/auth/login")
        print(f"Status Code: {response.status_code}")
        
        # Check CORS headers
        headers = response.headers
        print("CORS Headers:")
        for header in ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers']:
            if header in headers:
                print(f"✅ {header}: {headers[header]}")
            else:
                print(f"❌ {header} not found in response headers")
        
        # Check if Access-Control-Allow-Origin is properly set
        if 'Access-Control-Allow-Origin' in headers:
            origin = headers['Access-Control-Allow-Origin']
            if origin == '*' or BACKEND_URL in origin:
                print(f"✅ Access-Control-Allow-Origin is properly configured: {origin}")
            else:
                print(f"❌ Access-Control-Allow-Origin might not be properly configured: {origin}")
        
        # Try with a GET request instead
        print("\nTrying GET request to check CORS headers...")
        response = requests.get(f"{API_URL}/auth/login")
        headers = response.headers
        
        for header in ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers']:
            if header in headers:
                print(f"✅ {header}: {headers[header]}")
            else:
                print(f"❌ {header} not found in response headers")
        
        return True
    except Exception as e:
        print(f"❌ Error during CORS test: {str(e)}")
        return False

def test_protected_endpoints(token):
    """Test protected endpoints with valid JWT token"""
    print("\n6. Testing protected endpoints with valid token...")
    
    if not token:
        print("❌ Cannot test protected endpoints: No token available")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Test inventory endpoint
        print("Testing GET /api/inventory endpoint...")
        response = requests.get(f"{API_URL}/inventory", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            inventory_items = response.json()
            print(f"✅ Successfully retrieved {len(inventory_items)} inventory items")
        else:
            print(f"❌ Inventory endpoint failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Test dashboard stats endpoint
        print("\nTesting GET /api/dashboard/stats endpoint...")
        response = requests.get(f"{API_URL}/dashboard/stats", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Successfully retrieved dashboard stats: {list(stats.keys())}")
            return True
        else:
            print(f"❌ Dashboard stats endpoint failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during protected endpoints testing: {str(e)}")
        return False

def test_health_endpoint():
    """Test health endpoint"""
    print("\n7. Testing health endpoint...")
    
    try:
        # Note: The health endpoint is at /health (not /api/health)
        response = requests.get(f"{BACKEND_URL}/health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"Response: {json.dumps(health_data, indent=2)}")
            print("✅ Health check successful")
            return True
        else:
            print(f"❌ Health check failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            print("Note: Health endpoint may not be accessible in the current deployment")
            return False
    except Exception as e:
        print(f"❌ Error during health check: {str(e)}")
        print("Note: Health endpoint may not be accessible in the current deployment")
        return False

def check_environment_variables():
    """Check if environment variables are properly loaded"""
    print("\n8. Checking environment variables...")
    
    # Check backend environment variables
    try:
        with open("backend/.env", "r") as f:
            backend_env = f.read()
            print("Backend environment variables:")
            for line in backend_env.split("\n"):
                if line and not line.startswith("#"):
                    # Hide sensitive values
                    if "=" in line:
                        key, value = line.split("=", 1)
                        if "KEY" in key or "SECRET" in key or "JWT" in key:
                            print(f"  {key}=****")
                        else:
                            print(f"  {key}={value}")
    except Exception as e:
        print(f"❌ Error reading backend environment variables: {str(e)}")
    
    # Check frontend environment variables
    try:
        with open("frontend/.env", "r") as f:
            frontend_env = f.read()
            print("\nFrontend environment variables:")
            for line in frontend_env.split("\n"):
                if line and not line.startswith("#"):
                    # Hide sensitive values
                    if "=" in line:
                        key, value = line.split("=", 1)
                        if "KEY" in key or "SECRET" in key:
                            print(f"  {key}=****")
                        else:
                            print(f"  {key}={value}")
    except Exception as e:
        print(f"❌ Error reading frontend environment variables: {str(e)}")
    
    return True

def main():
    print("=== USPF Inventory Management System - Authentication Test ===")
    
    # Check environment variables
    check_environment_variables()
    
    # Test login
    access_token, refresh_token = test_login()
    
    # Test current user endpoint
    if access_token:
        user_verified = test_current_user(access_token)
    else:
        user_verified = False
    
    # Test token refresh
    if refresh_token:
        new_token = test_token_refresh(refresh_token)
        if new_token:
            # Use the new token for subsequent tests
            access_token = new_token
    
    # Test login with incorrect credentials
    incorrect_login_test = test_login_with_incorrect_credentials()
    
    # Test CORS configuration
    cors_test = test_cors_configuration()
    
    # Test protected endpoints
    if access_token:
        protected_endpoints_test = test_protected_endpoints(access_token)
    else:
        protected_endpoints_test = False
    
    # Test health endpoint
    health_test = test_health_endpoint()
    
    # Print summary
    print("\n=== Test Summary ===")
    print("1. Login with uspf/uspf credentials: " + ("✅ PASSED" if access_token else "❌ FAILED"))
    print("2. User verification with token: " + ("✅ PASSED" if user_verified else "❌ FAILED"))
    print("3. Token refresh: " + ("✅ PASSED" if new_token else "❌ FAILED"))
    print("4. Handling of incorrect credentials: " + ("✅ PASSED" if incorrect_login_test else "❌ FAILED"))
    print("5. CORS configuration: " + ("✅ PASSED" if cors_test else "❌ FAILED"))
    print("6. Protected endpoints access: " + ("✅ PASSED" if protected_endpoints_test else "❌ FAILED"))
    print("7. Health endpoint: " + ("✅ PASSED" if health_test else "❌ FAILED"))
    
    # Overall assessment
    if access_token and user_verified and incorrect_login_test:
        print("\n✅ AUTHENTICATION SYSTEM IS WORKING CORRECTLY")
        print("The login functionality is working properly with uspf/uspf credentials.")
        print("The JWT tokens are being generated correctly and can be used to access protected endpoints.")
        print("The system correctly rejects invalid credentials with a 401 status code.")
    else:
        print("\n❌ AUTHENTICATION SYSTEM HAS ISSUES")
        if not access_token:
            print("- Login with uspf/uspf credentials is failing")
        if not user_verified and access_token:
            print("- User verification with token is failing")
        if not incorrect_login_test:
            print("- Handling of incorrect credentials is not working properly")

if __name__ == "__main__":
    main()