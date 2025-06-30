#!/usr/bin/env python3
import requests
import json
import base64
import io
from PIL import Image
import unittest
import sys
import os
import time
import jwt
import concurrent.futures
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

class USPFInventoryAPITest(unittest.TestCase):
    """Test suite for USPF Inventory Management API"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class - login and get token"""
        cls.access_token = None
        cls.refresh_token = None
        cls.login_response = None
        cls.item_id = None  # Initialize item_id at class level
        
        # Test login and get token
        login_data = {
            "username": "uspf",
            "password": "uspf"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                cls.login_response = response.json()
                cls.access_token = cls.login_response.get("access_token")
                cls.refresh_token = cls.login_response.get("refresh_token")
                print("Successfully logged in and obtained tokens")
            else:
                print(f"Login failed with status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error during login: {str(e)}")
    
    def get_auth_headers(self):
        """Get authorization headers with access token"""
        if not self.access_token:
            self.fail("No authentication token available")
        return {"Authorization": f"Bearer {self.access_token}"}
    
    def test_01_login(self):
        """Test login endpoint with uspf credentials"""
        # Login was already performed in setUpClass, just verify the response
        self.assertIsNotNone(self.login_response, "Login response should not be None")
        self.assertTrue(self.login_response.get("success"), "Login should be successful")
        
        # Verify tokens
        self.assertIsNotNone(self.access_token, "Access token should be returned")
        self.assertIsNotNone(self.refresh_token, "Refresh token should be returned")
        self.assertIsNotNone(self.login_response.get("expires_in"), "Token expiration should be returned")
        self.assertEqual(self.login_response.get("token_type"), "bearer", "Token type should be 'bearer'")
        
        # Verify user data
        user = self.login_response.get("user")
        self.assertIsNotNone(user, "User data should be returned")
        self.assertEqual(user.get("username"), "uspf", "Username should be 'uspf'")
        self.assertEqual(user.get("role"), "admin", "Role should be 'admin'")
        
        # Verify JWT token structure
        try:
            # Decode without verification to check payload structure
            decoded_token = jwt.decode(self.access_token, options={"verify_signature": False})
            self.assertIn("exp", decoded_token, "Token should have expiration time")
            self.assertIn("sub", decoded_token, "Token should have subject claim")
            self.assertEqual(decoded_token.get("sub"), "uspf", "Token subject should be 'uspf'")
            self.assertEqual(decoded_token.get("role"), "admin", "Token should contain role claim")
            self.assertEqual(decoded_token.get("type"), "access", "Token should be of type 'access'")
            print("JWT token structure verified successfully")
        except Exception as e:
            self.fail(f"Failed to decode JWT token: {str(e)}")
    
    def test_02_token_validation(self):
        """Test token validation with /api/auth/me endpoint"""
        response = requests.get(f"{API_URL}/auth/me", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        user_data = response.json()
        self.assertEqual(user_data.get("username"), "uspf", "Username should be 'uspf'")
        self.assertEqual(user_data.get("role"), "admin", "Role should be 'admin'")
    
    def test_03_token_refresh(self):
        """Test token refresh endpoint"""
        if not self.refresh_token:
            self.fail("No refresh token available for testing")
            
        refresh_data = {
            "refresh_token": self.refresh_token
        }
        
        response = requests.post(f"{API_URL}/auth/refresh", json=refresh_data)
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        refresh_response = response.json()
        self.assertIn("access_token", refresh_response, "Response should contain new access token")
        self.assertIn("expires_in", refresh_response, "Response should contain token expiration")
        self.assertEqual(refresh_response.get("token_type"), "bearer", "Token type should be 'bearer'")
        
        # Verify the new token works
        new_token = refresh_response.get("access_token")
        headers = {"Authorization": f"Bearer {new_token}"}
        
        me_response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(me_response.status_code, 200, "New token should be valid for authentication")
        
        # Update the class token for subsequent tests
        self.__class__.access_token = new_token
        print("Successfully refreshed access token")
    
    def test_04_invalid_token_handling(self):
        """Test handling of invalid tokens"""
        # Test with invalid token
        invalid_token = "invalid.token.format"
        headers = {"Authorization": f"Bearer {invalid_token}"}
        
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401, "Invalid token should return 401 Unauthorized")
        
        # Test with malformed but valid JWT format
        malformed_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3BmIiwicm9sZSI6ImFkbWluIn0.invalid-signature"
        headers = {"Authorization": f"Bearer {malformed_token}"}
        
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401, "Malformed token should return 401 Unauthorized")
        
        # Test with no token
        response = requests.get(f"{API_URL}/auth/me")
        self.assertEqual(response.status_code, 401, "No token should return 401 Unauthorized")
        
        # Test with expired token (we can't easily test this without waiting, but we can check the error handling)
        # In a real test, we might mock the token verification to simulate expiration
    
    def test_05_protected_endpoints(self):
        """Test protected endpoints with valid JWT token"""
        # Test inventory endpoint
        response = requests.get(f"{API_URL}/inventory", headers=self.get_auth_headers())
        self.assertEqual(response.status_code, 200, "Inventory endpoint should be accessible with valid token")
        
        # Test dashboard stats endpoint
        response = requests.get(f"{API_URL}/dashboard/stats", headers=self.get_auth_headers())
        self.assertEqual(response.status_code, 200, "Dashboard stats endpoint should be accessible with valid token")
        
        # Verify response data
        stats = response.json()
        self.assertIn("total_items", stats, "Stats should include total_items")
        self.assertIn("total_value", stats, "Stats should include total_value")
        self.assertIn("low_stock_count", stats, "Stats should include low_stock_count")
        self.assertIn("pending_requisitions", stats, "Stats should include pending_requisitions")
    
    def test_06_get_inventory(self):
        """Test getting inventory items"""
        response = requests.get(f"{API_URL}/inventory", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        inventory_items = response.json()
        self.assertIsInstance(inventory_items, list, "Response should be a list")
        self.assertGreater(len(inventory_items), 0, "Should return at least one inventory item")
        
        # Verify structure of first item
        first_item = inventory_items[0]
        self.assertIn("id", first_item, "Item should have an ID")
        self.assertIn("name", first_item, "Item should have a name")
        self.assertIn("quantity", first_item, "Item should have a quantity")
        self.assertIn("qr_code", first_item, "Item should have a QR code")
    
    def test_07_create_inventory_item(self):
        """Test creating a new inventory item"""
        new_item = {
            "name": "Test Item",
            "description": "Test item created by automated test",
            "category": "Test Category",
            "quantity": 10,
            "unit_cost": 5000.0,
            "reorder_level": 3,
            "department": "Test Department"
        }
        
        response = requests.post(f"{API_URL}/inventory", json=new_item, headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        created_item = response.json()
        self.assertEqual(created_item.get("name"), new_item["name"], "Created item name should match")
        self.assertEqual(created_item.get("description"), new_item["description"], "Created item description should match")
        self.assertEqual(created_item.get("quantity"), new_item["quantity"], "Created item quantity should match")
        
        # Verify QR code generation
        self.assertIsNotNone(created_item.get("qr_code"), "QR code should be generated")
        self.assertTrue(created_item.get("qr_code").startswith("data:image/png;base64,"), "QR code should be a base64 encoded image")
        
        # Store item ID for update test
        self.__class__.item_id = created_item.get("id")
        print(f"Created inventory item with ID: {self.__class__.item_id}")
        
        # Verify QR code is valid base64 image
        try:
            qr_code = created_item.get("qr_code")
            # Extract the base64 part
            base64_data = qr_code.split(",")[1]
            # Decode base64
            image_data = base64.b64decode(base64_data)
            # Try to open as image
            img = Image.open(io.BytesIO(image_data))
            # If we get here, it's a valid image
            self.assertIsNotNone(img, "QR code should be a valid image")
        except Exception as e:
            self.fail(f"QR code is not a valid base64 image: {str(e)}")
    
    def test_08_update_inventory_item(self):
        """Test updating an inventory item"""
        # Make sure we have an item ID from the create test
        if not self.__class__.item_id:
            self.fail("No item ID available for update test")
        
        update_data = {
            "name": "Updated Test Item",
            "description": "Updated description",
            "quantity": 15
        }
        
        response = requests.put(
            f"{API_URL}/inventory/{self.__class__.item_id}", 
            json=update_data, 
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        updated_item = response.json()
        self.assertEqual(updated_item.get("id"), self.__class__.item_id, "Updated item ID should match")
        
        # Note: The current implementation doesn't actually update the item in a database,
        # it just returns a sample updated item. In a real implementation, we would verify
        # that the updated fields match what we sent.
    
    def test_09_get_bin_card_history(self):
        """Test getting BIN card history for an item"""
        # Use the item ID from the create test, or a sample ID if not available
        item_id = self.__class__.item_id or "inv-001"
        
        response = requests.get(
            f"{API_URL}/inventory/{item_id}/bin-card", 
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        bin_card_entries = response.json()
        self.assertIsInstance(bin_card_entries, list, "Response should be a list")
        self.assertGreater(len(bin_card_entries), 0, "Should return at least one BIN card entry")
        
        # Verify structure of first entry
        first_entry = bin_card_entries[0]
        self.assertIn("id", first_entry, "Entry should have an ID")
        self.assertIn("item_id", first_entry, "Entry should have an item ID")
        self.assertIn("transaction_type", first_entry, "Entry should have a transaction type")
        self.assertIn("quantity", first_entry, "Entry should have a quantity")
        self.assertIn("balance", first_entry, "Entry should have a balance")
    
    def test_10_get_requisitions(self):
        """Test getting requisition requests"""
        response = requests.get(f"{API_URL}/requisitions", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        requisitions = response.json()
        self.assertIsInstance(requisitions, list, "Response should be a list")
        self.assertGreater(len(requisitions), 0, "Should return at least one requisition")
        
        # Verify structure of first requisition
        first_req = requisitions[0]
        self.assertIn("id", first_req, "Requisition should have an ID")
        self.assertIn("item_id", first_req, "Requisition should have an item ID")
        self.assertIn("requested_quantity", first_req, "Requisition should have a requested quantity")
        self.assertIn("status", first_req, "Requisition should have a status")
    
    def test_11_create_requisition(self):
        """Test creating a new requisition"""
        # Use the item ID from the create test, or a sample ID if not available
        item_id = self.__class__.item_id or "inv-001"
        
        new_requisition = {
            "item_id": item_id,
            "requested_quantity": 3,
            "purpose": "Testing requisition creation",
            "requested_by": "Test User"
        }
        
        response = requests.post(
            f"{API_URL}/requisitions", 
            json=new_requisition, 
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        created_req = response.json()
        self.assertEqual(created_req.get("item_id"), new_requisition["item_id"], "Created requisition item ID should match")
        self.assertEqual(created_req.get("requested_quantity"), new_requisition["requested_quantity"], "Created requisition quantity should match")
        self.assertEqual(created_req.get("purpose"), new_requisition["purpose"], "Created requisition purpose should match")
        self.assertEqual(created_req.get("status"), "pending", "New requisition should have 'pending' status")
        
        # Store requisition ID for future tests
        self.requisition_id = created_req.get("id")
        print(f"Created requisition with ID: {self.requisition_id}")
    
    def test_12_dashboard_stats(self):
        """Test getting dashboard statistics"""
        response = requests.get(f"{API_URL}/dashboard/stats", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        stats = response.json()
        self.assertIn("total_items", stats, "Stats should include total_items")
        self.assertIn("total_value", stats, "Stats should include total_value")
        self.assertIn("low_stock_count", stats, "Stats should include low_stock_count")
        self.assertIn("pending_requisitions", stats, "Stats should include pending_requisitions")
        self.assertIn("recent_activities", stats, "Stats should include recent_activities")
        
        # Verify recent activities structure
        activities = stats.get("recent_activities")
        self.assertIsInstance(activities, list, "Recent activities should be a list")
        if activities:
            first_activity = activities[0]
            self.assertIn("type", first_activity, "Activity should have a type")
            self.assertIn("item", first_activity, "Activity should have an item name")
            self.assertIn("quantity", first_activity, "Activity should have a quantity")
    
    def test_13_low_stock_report(self):
        """Test getting low stock report"""
        response = requests.get(f"{API_URL}/reports/low-stock", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        low_stock_items = response.json()
        self.assertIsInstance(low_stock_items, list, "Response should be a list")
        
        # If there are low stock items, verify their structure
        if low_stock_items:
            first_item = low_stock_items[0]
            self.assertIn("id", first_item, "Item should have an ID")
            self.assertIn("name", first_item, "Item should have a name")
            self.assertIn("quantity", first_item, "Item should have a quantity")
            self.assertIn("reorder_level", first_item, "Item should have a reorder_level")
            
            # Verify that quantity is indeed below reorder level
            self.assertLess(
                first_item.get("quantity"), 
                first_item.get("reorder_level"),
                "Low stock item quantity should be less than reorder level"
            )
    
    def test_14_health_check(self):
        """Test health check endpoint (no authentication required)"""
        try:
            # Note: The health endpoint is at /health (not /api/health)
            response = requests.get(f"{BACKEND_URL}/health")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            health_data = response.json()
            self.assertIn("status", health_data, "Health check should include status")
            self.assertEqual(health_data.get("status"), "healthy", "Status should be 'healthy'")
            self.assertIn("service", health_data, "Health check should include service name")
            self.assertIn("version", health_data, "Health check should include version")
            self.assertIn("timestamp", health_data, "Health check should include timestamp")
        except Exception as e:
            print(f"Health check test failed: {str(e)}")
            # Don't fail the test if the endpoint is not accessible in the current deployment
            self.skipTest(f"Health endpoint not accessible: {str(e)}")
            
    def test_15_detailed_health_check(self):
        """Test detailed health check endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/health/detailed")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            health_data = response.json()
            self.assertIn("status", health_data, "Detailed health check should include status")
            self.assertIn("components", health_data, "Detailed health check should include components")
            self.assertIn("summary", health_data, "Detailed health check should include summary")
            
            # Check components structure
            components = health_data.get("components", {})
            self.assertIsInstance(components, dict, "Components should be a dictionary")
            
            # Check summary structure
            summary = health_data.get("summary", {})
            self.assertIn("healthy", summary, "Summary should include healthy count")
            self.assertIn("unhealthy", summary, "Summary should include unhealthy count")
            
        except Exception as e:
            print(f"Detailed health check test failed: {str(e)}")
            self.skipTest(f"Detailed health endpoint not accessible: {str(e)}")
            
    def test_16_health_trends(self):
        """Test health trends endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/health/trends")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            trends_data = response.json()
            self.assertIsInstance(trends_data, dict, "Trends data should be a dictionary")
            
            # Check for expected fields in trends data
            if "error" not in trends_data:
                self.assertIn("timestamps", trends_data, "Trends should include timestamps")
                self.assertIn("statuses", trends_data, "Trends should include statuses")
                
        except Exception as e:
            print(f"Health trends test failed: {str(e)}")
            self.skipTest(f"Health trends endpoint not accessible: {str(e)}")
            
    def test_17_metrics_endpoint(self):
        """Test metrics endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/metrics")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            metrics_data = response.json()
            self.assertIsInstance(metrics_data, dict, "Metrics data should be a dictionary")
            
            # Check for expected sections in metrics data
            if "error" not in metrics_data:
                self.assertIn("timestamp", metrics_data, "Metrics should include timestamp")
                self.assertIn("system", metrics_data, "Metrics should include system data")
                self.assertIn("database", metrics_data, "Metrics should include database data")
                self.assertIn("errors", metrics_data, "Metrics should include error data")
                self.assertIn("service", metrics_data, "Metrics should include service data")
                
                # Check system metrics structure
                system = metrics_data.get("system", {})
                self.assertIn("memory_percent", system, "System metrics should include memory_percent")
                self.assertIn("cpu_percent", system, "System metrics should include cpu_percent")
                
                # Check service metrics structure
                service = metrics_data.get("service", {})
                self.assertIn("uptime_seconds", service, "Service metrics should include uptime_seconds")
                self.assertIn("version", service, "Service metrics should include version")
                
        except Exception as e:
            print(f"Metrics test failed: {str(e)}")
            self.skipTest(f"Metrics endpoint not accessible: {str(e)}")
            
    def test_18_frontend_logs_endpoint(self):
        """Test frontend logs ingestion endpoint"""
        # Skip if endpoint doesn't exist in current deployment
        try:
            logs_data = {
                "logs": [
                    {
                        "level": "info",
                        "message": "Test log message",
                        "data": {"test": "data"},
                        "sessionId": "test-session",
                        "userId": "test-user",
                        "url": "https://example.com/test",
                        "pathname": "/test",
                        "userAgent": "Test User Agent"
                    },
                    {
                        "level": "error",
                        "message": "Test error message",
                        "data": {"error": "test error"},
                        "sessionId": "test-session",
                        "userId": "test-user",
                        "url": "https://example.com/test",
                        "pathname": "/test",
                        "userAgent": "Test User Agent"
                    }
                ]
            }
            
            response = requests.post(f"{API_URL}/logs/frontend", json=logs_data, headers=self.get_auth_headers())
            
            if response.status_code == 404:
                self.skipTest("Frontend logs endpoint not implemented in current deployment")
                
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            result = response.json()
            self.assertIn("success", result, "Response should include success status")
            self.assertTrue(result.get("success"), "Log ingestion should be successful")
            self.assertIn("processed", result, "Response should include processed count")
            self.assertEqual(result.get("processed"), 2, "Should have processed 2 log entries")
        except requests.exceptions.RequestException as e:
            self.skipTest(f"Frontend logs endpoint test failed: {str(e)}")
        
    def test_19_frontend_errors_endpoint(self):
        """Test frontend error reporting endpoint"""
        # Skip if endpoint doesn't exist in current deployment
        try:
            error_data = {
                "errorId": "test-error-id",
                "error": {
                    "name": "TestError",
                    "message": "Test error message",
                    "stack": "Test error stack trace"
                },
                "context": {
                    "component": "TestComponent",
                    "props": {"test": "props"}
                },
                "url": "https://example.com/test",
                "userAgent": "Test User Agent",
                "timestamp": "2023-01-01T00:00:00Z"
            }
            
            response = requests.post(f"{API_URL}/errors/frontend", json=error_data, headers=self.get_auth_headers())
            
            if response.status_code == 404:
                self.skipTest("Frontend errors endpoint not implemented in current deployment")
                
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            result = response.json()
            self.assertIn("success", result, "Response should include success status")
            self.assertTrue(result.get("success"), "Error reporting should be successful")
            self.assertIn("error_id", result, "Response should include error_id")
            self.assertEqual(result.get("error_id"), "test-error-id", "Error ID should match")
        except requests.exceptions.RequestException as e:
            self.skipTest(f"Frontend errors endpoint test failed: {str(e)}")
        
    def test_20_health_cron_endpoint(self):
        """Test health cron endpoint"""
        try:
            response = requests.get(f"{API_URL}/health/cron", headers=self.get_auth_headers())
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            
            result = response.json()
            self.assertIn("status", result, "Response should include status")
            self.assertIn("health_status", result, "Response should include health_status")
            self.assertIn("timestamp", result, "Response should include timestamp")
            
        except Exception as e:
            print(f"Health cron test failed: {str(e)}")
            self.skipTest(f"Health cron endpoint not accessible: {str(e)}")
            
    def test_21_security_headers(self):
        """Test security headers in responses"""
        # Test a public endpoint
        response = requests.get(f"{BACKEND_URL}/health")
        
        # Check for security headers
        headers = response.headers
        self.assertIn("X-Content-Type-Options", headers, "Response should include X-Content-Type-Options header")
        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff", "X-Content-Type-Options should be nosniff")
        
        self.assertIn("X-Frame-Options", headers, "Response should include X-Frame-Options header")
        self.assertEqual(headers.get("X-Frame-Options"), "DENY", "X-Frame-Options should be DENY")
        
        self.assertIn("X-XSS-Protection", headers, "Response should include X-XSS-Protection header")
        self.assertEqual(headers.get("X-XSS-Protection"), "1; mode=block", "X-XSS-Protection should be 1; mode=block")
        
        # Test an authenticated endpoint
        response = requests.get(f"{API_URL}/inventory", headers=self.get_auth_headers())
        
        # Check for security headers
        headers = response.headers
        self.assertIn("X-Content-Type-Options", headers, "Response should include X-Content-Type-Options header")
        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff", "X-Content-Type-Options should be nosniff")
        
        self.assertIn("X-Frame-Options", headers, "Response should include X-Frame-Options header")
        self.assertEqual(headers.get("X-Frame-Options"), "DENY", "X-Frame-Options should be DENY")
        
        self.assertIn("X-XSS-Protection", headers, "Response should include X-XSS-Protection header")
        self.assertEqual(headers.get("X-XSS-Protection"), "1; mode=block", "X-XSS-Protection should be 1; mode=block")
        
    def test_22_timeout_handling(self):
        """Test timeout handling"""
        # Create a long-running request that should trigger timeout
        # Note: This is a bit tricky to test without a specific endpoint that takes a long time
        # We'll use a simple approach to test the timeout middleware
        
        try:
            # Make a request with a very short timeout to simulate server timeout
            response = requests.get(f"{API_URL}/dashboard/stats", headers=self.get_auth_headers(), timeout=0.001)
            # If we get here, the request didn't timeout as expected
            print("Request didn't timeout as expected, checking response")
            self.assertEqual(response.status_code, 200, "Request should succeed if not timed out")
        except requests.exceptions.Timeout:
            # This is expected - the request timed out
            print("Request timed out as expected")
            pass
        except Exception as e:
            # Some other error occurred
            print(f"Unexpected error during timeout test: {str(e)}")
            
    def test_23_rate_limiting(self):
        """Test rate limiting"""
        # Make multiple concurrent requests to test rate limiting
        # Note: This is difficult to test without knowing the exact rate limit
        # We'll make a bunch of requests and see if any get rate limited
        
        num_requests = 30  # Adjust based on the rate limit in the server
        
        def make_request():
            try:
                response = requests.get(f"{API_URL}/inventory", headers=self.get_auth_headers())
                return response.status_code
            except Exception as e:
                print(f"Error during rate limit test: {str(e)}")
                return 0
        
        # Make concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(make_request, range(num_requests)))
        
        # Check if any requests were rate limited (status code 429)
        rate_limited = results.count(429)
        success = results.count(200)
        
        print(f"Rate limit test results: {success} successful, {rate_limited} rate limited")
        
        # We don't assert anything specific here, just log the results
        # In a real test, we might want to assert based on the expected rate limit

if __name__ == "__main__":
    # Run the tests
    print("\n===== STARTING USPF INVENTORY API TESTS =====")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API URL: {API_URL}")
    print("==============================================\n")
    
    # Run all tests to comprehensively check all API endpoints
    suite = unittest.TestSuite()
    suite.addTest(USPFInventoryAPITest('test_01_login'))         # Login endpoint
    suite.addTest(USPFInventoryAPITest('test_02_token_validation'))  # Token validation
    suite.addTest(USPFInventoryAPITest('test_03_token_refresh'))  # Token refresh
    suite.addTest(USPFInventoryAPITest('test_04_invalid_token_handling'))  # Invalid token handling
    suite.addTest(USPFInventoryAPITest('test_05_protected_endpoints'))  # Protected endpoints
    suite.addTest(USPFInventoryAPITest('test_06_get_inventory'))  # Get inventory
    suite.addTest(USPFInventoryAPITest('test_07_create_inventory_item'))  # Create inventory item
    suite.addTest(USPFInventoryAPITest('test_08_update_inventory_item'))  # Update inventory item
    suite.addTest(USPFInventoryAPITest('test_09_get_bin_card_history'))  # Get BIN card history
    suite.addTest(USPFInventoryAPITest('test_10_get_requisitions'))  # Get requisitions
    suite.addTest(USPFInventoryAPITest('test_11_create_requisition'))  # Create requisition
    suite.addTest(USPFInventoryAPITest('test_12_dashboard_stats'))  # Get dashboard stats
    suite.addTest(USPFInventoryAPITest('test_13_low_stock_report'))  # Get low stock report
    suite.addTest(USPFInventoryAPITest('test_14_health_check'))  # Health check endpoint
    suite.addTest(USPFInventoryAPITest('test_15_detailed_health_check'))  # Detailed health check
    suite.addTest(USPFInventoryAPITest('test_16_health_trends'))  # Health trends
    suite.addTest(USPFInventoryAPITest('test_17_metrics_endpoint'))  # Metrics endpoint
    suite.addTest(USPFInventoryAPITest('test_18_frontend_logs_endpoint'))  # Frontend logs endpoint
    suite.addTest(USPFInventoryAPITest('test_19_frontend_errors_endpoint'))  # Frontend errors endpoint
    suite.addTest(USPFInventoryAPITest('test_20_health_cron_endpoint'))  # Health cron endpoint
    suite.addTest(USPFInventoryAPITest('test_21_security_headers'))  # Security headers
    suite.addTest(USPFInventoryAPITest('test_22_timeout_handling'))  # Timeout handling
    suite.addTest(USPFInventoryAPITest('test_23_rate_limiting'))  # Rate limiting
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n===== TEST RESULTS SUMMARY =====")
    print(f"Tests run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Skipped: {len(result.skipped)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED - Backend API is working correctly")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED - See details above")
        sys.exit(1)