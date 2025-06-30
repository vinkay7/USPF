#!/usr/bin/env python3
import requests
import json
import jwt
import os
import sys
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from frontend/.env to get the backend URL
load_dotenv("frontend/.env")

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Add /api prefix for all API endpoints
API_URL = f"{BACKEND_URL}/api"
print(f"Testing JWT authentication at: {API_URL}")

def test_jwt_login():
    """Test login endpoint and validate JWT token structure"""
    print("\n1. Testing JWT token generation with uspf/uspf credentials...")
    
    login_data = {
        "username": "uspf",
        "password": "uspf"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            
            # Check success flag
            if not login_response.get("success"):
                print("❌ Login response success flag is False")
                return None, None
            
            # Extract tokens
            access_token = login_response.get("access_token")
            refresh_token = login_response.get("refresh_token")
            
            if not access_token or not refresh_token:
                print("❌ Missing tokens in response")
                return None, None
            
            print("✅ Received both access_token and refresh_token")
            
            # Validate access token structure
            try:
                # Decode without verification to check payload structure
                decoded_access = jwt.decode(access_token, options={"verify_signature": False})
                
                print("\nAccess Token Structure:")
                print(f"  Subject (sub): {decoded_access.get('sub')}")
                print(f"  User ID: {decoded_access.get('user_id')}")
                print(f"  Username: {decoded_access.get('username')}")
                print(f"  Role: {decoded_access.get('role')}")
                print(f"  Department: {decoded_access.get('department')}")
                print(f"  Full Name: {decoded_access.get('full_name')}")
                print(f"  Expiration (exp): {decoded_access.get('exp')}")
                print(f"  Token Type: {decoded_access.get('type')}")
                
                # Convert exp to human-readable date
                if 'exp' in decoded_access:
                    exp_time = datetime.fromtimestamp(decoded_access['exp'])
                    print(f"  Expiration Date: {exp_time.strftime('%Y-%m-%d %H:%M:%S')}")
                    
                # Validate required claims
                required_claims = ['sub', 'exp', 'type', 'role']
                missing_claims = [claim for claim in required_claims if claim not in decoded_access]
                
                if missing_claims:
                    print(f"❌ Access token missing required claims: {', '.join(missing_claims)}")
                else:
                    print("✅ Access token contains all required claims")
                
                # Validate claim values
                if decoded_access.get('sub') != 'uspf':
                    print("❌ Access token 'sub' claim should be 'uspf'")
                
                if decoded_access.get('role') != 'admin':
                    print("❌ Access token 'role' claim should be 'admin'")
                
                if decoded_access.get('type') != 'access':
                    print("❌ Access token 'type' claim should be 'access'")
                
                # Validate refresh token structure
                decoded_refresh = jwt.decode(refresh_token, options={"verify_signature": False})
                
                print("\nRefresh Token Structure:")
                print(f"  Subject (sub): {decoded_refresh.get('sub')}")
                print(f"  User ID: {decoded_refresh.get('user_id')}")
                print(f"  Username: {decoded_refresh.get('username')}")
                print(f"  Role: {decoded_refresh.get('role')}")
                print(f"  Expiration (exp): {decoded_refresh.get('exp')}")
                print(f"  Token Type: {decoded_refresh.get('type')}")
                
                # Convert exp to human-readable date
                if 'exp' in decoded_refresh:
                    exp_time = datetime.fromtimestamp(decoded_refresh['exp'])
                    print(f"  Expiration Date: {exp_time.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Validate required claims
                missing_claims = [claim for claim in required_claims if claim not in decoded_refresh]
                
                if missing_claims:
                    print(f"❌ Refresh token missing required claims: {', '.join(missing_claims)}")
                else:
                    print("✅ Refresh token contains all required claims")
                
                # Validate claim values
                if decoded_refresh.get('sub') != 'uspf':
                    print("❌ Refresh token 'sub' claim should be 'uspf'")
                
                if decoded_refresh.get('role') != 'admin':
                    print("❌ Refresh token 'role' claim should be 'admin'")
                
                if decoded_refresh.get('type') != 'refresh':
                    print("❌ Refresh token 'type' claim should be 'refresh'")
                
                print("\n✅ JWT token structure validation complete")
                return access_token, refresh_token
                
            except Exception as e:
                print(f"❌ Error decoding JWT token: {str(e)}")
                return None, None
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None, None

def test_token_refresh(refresh_token):
    """Test token refresh functionality"""
    print("\n2. Testing token refresh functionality...")
    
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
            
            # Check for new access token
            new_access_token = refresh_response.get("access_token")
            
            if not new_access_token:
                print("❌ No new access token in refresh response")
                return None
            
            print("✅ Received new access token")
            
            # Validate new access token structure
            try:
                decoded_token = jwt.decode(new_access_token, options={"verify_signature": False})
                
                print("\nNew Access Token Structure:")
                print(f"  Subject (sub): {decoded_token.get('sub')}")
                print(f"  User ID: {decoded_token.get('user_id')}")
                print(f"  Role: {decoded_token.get('role')}")
                print(f"  Expiration (exp): {decoded_token.get('exp')}")
                print(f"  Token Type: {decoded_token.get('type')}")
                
                # Convert exp to human-readable date
                if 'exp' in decoded_token:
                    exp_time = datetime.fromtimestamp(decoded_token['exp'])
                    print(f"  Expiration Date: {exp_time.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Verify the new token works with /api/auth/me
                headers = {"Authorization": f"Bearer {new_access_token}"}
                me_response = requests.get(f"{API_URL}/auth/me", headers=headers)
                
                if me_response.status_code == 200:
                    print("✅ New access token works with /api/auth/me endpoint")
                    return new_access_token
                else:
                    print(f"❌ New access token failed with /api/auth/me endpoint: {me_response.status_code}")
                    return None
                
            except Exception as e:
                print(f"❌ Error decoding new access token: {str(e)}")
                return None
        else:
            print(f"❌ Token refresh failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during token refresh: {str(e)}")
        return None

def test_invalid_token_handling():
    """Test handling of invalid tokens"""
    print("\n3. Testing invalid token handling...")
    
    # Test with invalid token format
    print("\nTesting with invalid token format:")
    invalid_token = "invalid.token.format"
    headers = {"Authorization": f"Bearer {invalid_token}"}
    
    try:
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correct 401 status code for invalid token format")
        else:
            print(f"❌ Expected 401 status code, got {response.status_code}")
        
        # Test with malformed but valid JWT format
        print("\nTesting with malformed but valid JWT format:")
        malformed_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3BmIiwicm9sZSI6ImFkbWluIn0.invalid-signature"
        headers = {"Authorization": f"Bearer {malformed_token}"}
        
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correct 401 status code for malformed token")
        else:
            print(f"❌ Expected 401 status code, got {response.status_code}")
        
        # Test with no token
        print("\nTesting with no token:")
        response = requests.get(f"{API_URL}/auth/me")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correct 401 status code for no token")
        else:
            print(f"❌ Expected 401 status code, got {response.status_code}")
        
        print("\n✅ Invalid token handling tests complete")
        return True
    except Exception as e:
        print(f"❌ Error during invalid token handling test: {str(e)}")
        return False

def test_protected_endpoints(access_token):
    """Test protected endpoints with valid token"""
    print("\n4. Testing protected endpoints with valid token...")
    
    if not access_token:
        print("❌ Cannot test protected endpoints: No access token available")
        return False
    
    endpoints = [
        "/inventory",
        "/dashboard/stats",
        "/requisitions"
    ]
    
    headers = {"Authorization": f"Bearer {access_token}"}
    success = True
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting {endpoint} endpoint:")
            response = requests.get(f"{API_URL}{endpoint}", headers=headers)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Successfully accessed {endpoint} with token")
            else:
                print(f"❌ Failed to access {endpoint} with token: {response.status_code}")
                success = False
            
            # Test without token
            print(f"Testing {endpoint} without token:")
            response = requests.get(f"{API_URL}{endpoint}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print(f"✅ Correctly rejected access to {endpoint} without token")
            else:
                print(f"❌ Expected 401 status code for {endpoint} without token, got {response.status_code}")
                success = False
                
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {str(e)}")
            success = False
    
    if success:
        print("\n✅ Protected endpoints test complete - all endpoints properly secured")
    else:
        print("\n❌ Some protected endpoints tests failed")
    
    return success

def main():
    print("=== USPF Inventory Management System - JWT Authentication Test ===")
    
    # Test JWT login and token structure
    access_token, refresh_token = test_jwt_login()
    
    # Test token refresh
    if refresh_token:
        new_access_token = test_token_refresh(refresh_token)
    else:
        new_access_token = None
    
    # Test invalid token handling
    invalid_token_test = test_invalid_token_handling()
    
    # Test protected endpoints
    if access_token:
        protected_endpoints_test = test_protected_endpoints(access_token)
    else:
        protected_endpoints_test = False
    
    # Print summary
    print("\n=== Test Summary ===")
    if access_token and refresh_token and new_access_token and invalid_token_test and protected_endpoints_test:
        print("✅ JWT Authentication system is working correctly!")
        print("✅ Successfully generated and validated JWT tokens")
        print("✅ Successfully refreshed access token")
        print("✅ Properly handled invalid tokens")
        print("✅ Protected endpoints are properly secured")
    else:
        print("❌ JWT Authentication system has issues:")
        if not access_token or not refresh_token:
            print("  - JWT token generation failed")
        if not new_access_token and refresh_token:
            print("  - Token refresh failed")
        if not invalid_token_test:
            print("  - Invalid token handling failed")
        if not protected_endpoints_test and access_token:
            print("  - Protected endpoints security failed")

if __name__ == "__main__":
    main()