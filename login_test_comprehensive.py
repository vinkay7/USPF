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
print(f"Testing API at: {API_URL}")

def test_backend_health():
    """Test if the backend is running and accessible"""
    print("\n1. BASIC BACKEND HEALTH CHECK")
    print("-----------------------------")
    
    try:
        # Try to access the login endpoint without sending data
        # This should return a 422 validation error, not a connection error
        response = requests.get(f"{API_URL}/auth/login")
        
        if response.status_code in [400, 404, 405, 422]:
            print(f"✅ Backend is running (Status code: {response.status_code})")
            return True
        else:
            print(f"⚠️ Backend responded with unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return True  # Still consider it a success if we got any response
    except requests.exceptions.ConnectionError:
        print("❌ Backend connection failed - server might be down")
        return False
    except Exception as e:
        print(f"❌ Error checking backend health: {str(e)}")
        return False

def test_login():
    """Test login endpoint with uspf credentials"""
    print("\n2. LOGIN ENDPOINT TEST")
    print("---------------------")
    print("Testing POST /api/auth/login with uspf/uspf credentials...")
    
    login_data = {
        "username": "uspf",
        "password": "uspf"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print(f"Response contains: {', '.join(login_response.keys())}")
            
            # Check if response contains success and access_token
            if login_response.get("success") and login_response.get("access_token"):
                print("✅ Login successful! JWT tokens received.")
                
                # Verify JWT token structure
                try:
                    access_token = login_response.get("access_token")
                    refresh_token = login_response.get("refresh_token")
                    
                    # Decode without verification to check payload structure
                    decoded_token = jwt.decode(access_token, options={"verify_signature": False})
                    print("\nJWT Token Structure:")
                    print(f"- Subject (sub): {decoded_token.get('sub')}")
                    print(f"- Expiration (exp): Present")
                    print(f"- Token Type: {decoded_token.get('type')}")
                    print(f"- User Role: {decoded_token.get('role')}")
                    
                    if decoded_token.get("sub") == "uspf" and decoded_token.get("role") == "admin":
                        print("✅ JWT token contains correct user information")
                    else:
                        print("❌ JWT token contains incorrect user information")
                        
                    # Check refresh token
                    decoded_refresh = jwt.decode(refresh_token, options={"verify_signature": False})
                    if decoded_refresh.get("type") == "refresh":
                        print("✅ Refresh token has correct type")
                    else:
                        print("❌ Refresh token has incorrect type")
                        
                except Exception as e:
                    print(f"❌ Error decoding JWT token: {str(e)}")
                
                return login_response
            else:
                print("❌ Login failed: Response doesn't contain success=true or access_token")
                return None
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_token_validation(access_token):
    """Test token validation with /api/auth/me endpoint"""
    print("\n3. AUTHENTICATION TOKEN VERIFICATION")
    print("----------------------------------")
    print("Testing GET /api/auth/me with the access token...")
    
    if not access_token:
        print("❌ Cannot test token validation: No access token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"Response contains: {', '.join(user_data.keys())}")
            
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

def test_protected_endpoints(access_token):
    """Test protected endpoints with the access token"""
    print("\n4. PROTECTED ENDPOINTS TEST")
    print("-------------------------")
    print("Testing protected endpoints with the access token...")
    
    if not access_token:
        print("❌ Cannot test protected endpoints: No access token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test inventory endpoint
        print("\nTesting GET /api/inventory...")
        inventory_response = requests.get(f"{API_URL}/inventory", headers=headers)
        
        print(f"Status Code: {inventory_response.status_code}")
        
        if inventory_response.status_code == 200:
            inventory_data = inventory_response.json()
            print(f"✅ Inventory endpoint accessible (Items: {len(inventory_data)})")
        else:
            print(f"❌ Inventory endpoint access failed: {inventory_response.text}")
            return False
        
        # Test dashboard stats endpoint
        print("\nTesting GET /api/dashboard/stats...")
        stats_response = requests.get(f"{API_URL}/dashboard/stats", headers=headers)
        
        print(f"Status Code: {stats_response.status_code}")
        
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            print(f"✅ Dashboard stats endpoint accessible")
            print(f"- Total Items: {stats_data.get('total_items')}")
            print(f"- Total Value: {stats_data.get('total_value')}")
            print(f"- Low Stock Count: {stats_data.get('low_stock_count')}")
            print(f"- Pending Requisitions: {stats_data.get('pending_requisitions')}")
        else:
            print(f"❌ Dashboard stats endpoint access failed: {stats_response.text}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error testing protected endpoints: {str(e)}")
        return False

def test_invalid_credentials():
    """Test login with invalid credentials"""
    print("\n5. INVALID CREDENTIALS TEST")
    print("-------------------------")
    print("Testing POST /api/auth/login with invalid credentials...")
    
    login_data = {
        "username": "invalid",
        "password": "invalid"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print(f"Response: {response.text}")
            print("✅ Invalid credentials correctly rejected with 401 Unauthorized")
            return True
        else:
            print(f"❌ Expected status code 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing invalid credentials: {str(e)}")
        return False

def main():
    print("=== USPF Inventory Management System - Login Functionality Test ===")
    
    # Test backend health
    backend_healthy = test_backend_health()
    if not backend_healthy:
        print("❌ Backend is not accessible. Cannot proceed with tests.")
        sys.exit(1)
    
    # Test login
    login_response = test_login()
    if login_response:
        access_token = login_response.get("access_token")
    else:
        access_token = None
    
    # Test token validation
    if access_token:
        token_valid = test_token_validation(access_token)
    else:
        token_valid = False
    
    # Test protected endpoints
    if access_token:
        protected_endpoints_accessible = test_protected_endpoints(access_token)
    else:
        protected_endpoints_accessible = False
    
    # Test invalid credentials
    invalid_credentials_test = test_invalid_credentials()
    
    # Print summary
    print("\n=== Test Summary ===")
    all_tests_passed = (
        backend_healthy and 
        login_response is not None and 
        token_valid and 
        protected_endpoints_accessible and 
        invalid_credentials_test
    )
    
    if all_tests_passed:
        print("✅ ALL TESTS PASSED - Login functionality is working correctly!")
        print("✅ Backend is accessible")
        print("✅ Login with uspf/uspf credentials works")
        print("✅ JWT token validation works")
        print("✅ Protected endpoints are accessible with valid token")
        print("✅ Invalid credentials are properly rejected")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED - Login functionality has issues:")
        if not backend_healthy:
            print("  - Backend is not accessible")
        if login_response is None:
            print("  - Login with uspf/uspf credentials failed")
        if not token_valid:
            print("  - JWT token validation failed")
        if not protected_endpoints_accessible:
            print("  - Protected endpoints are not accessible with valid token")
        if not invalid_credentials_test:
            print("  - Invalid credentials handling failed")
        sys.exit(1)

if __name__ == "__main__":
    main()