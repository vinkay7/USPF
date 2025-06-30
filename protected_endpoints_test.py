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
print(f"Testing Protected Endpoints at: {API_URL}")

def get_token():
    """Get authentication token"""
    login_data = {
        "username": "uspf",
        "password": "uspf"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            login_response = response.json()
            return login_response.get("token")
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_inventory_endpoint(token):
    """Test /api/inventory endpoint with token"""
    print("\n1. Testing GET /api/inventory with token...")
    
    if not token:
        print("❌ Cannot test /api/inventory: No token available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/inventory", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            inventory_items = response.json()
            print(f"✅ Successfully retrieved {len(inventory_items)} inventory items")
            # Print first item as example
            if inventory_items:
                print(f"Example item: {json.dumps(inventory_items[0], indent=2, default=str)}")
        else:
            print(f"❌ Failed to access inventory with status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error accessing inventory: {str(e)}")

def test_dashboard_stats(token):
    """Test /api/dashboard/stats endpoint with token"""
    print("\n2. Testing GET /api/dashboard/stats with token...")
    
    if not token:
        print("❌ Cannot test /api/dashboard/stats: No token available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/dashboard/stats", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Successfully retrieved dashboard stats")
            print(f"Stats: {json.dumps(stats, indent=2, default=str)}")
        else:
            print(f"❌ Failed to access dashboard stats with status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error accessing dashboard stats: {str(e)}")

def test_without_token():
    """Test accessing protected endpoints without token"""
    print("\n3. Testing protected endpoints without token...")
    
    endpoints = [
        "/inventory",
        "/dashboard/stats",
        "/auth/me"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting GET {API_URL}{endpoint} without token...")
            response = requests.get(f"{API_URL}{endpoint}")
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print(f"✅ Correctly rejected unauthorized access to {endpoint}")
            else:
                print(f"❌ Expected 401 status, got {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"❌ Error testing endpoint without token: {str(e)}")

def main():
    print("=== USPF Inventory Management System - Protected Endpoints Test ===")
    
    # Get token
    token = get_token()
    if token:
        print(f"✅ Successfully obtained token: {token}")
    else:
        print("❌ Failed to obtain token, cannot proceed with protected endpoint tests")
        return
    
    # Test protected endpoints with token
    test_inventory_endpoint(token)
    test_dashboard_stats(token)
    
    # Test protected endpoints without token
    test_without_token()
    
    print("\n=== Protected Endpoints Test Complete ===")

if __name__ == "__main__":
    main()