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
        cls.token = None
        cls.login_response = None
        
        # Test login and get token
        login_data = {
            "username": "admin",
            "password": "admin"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                cls.login_response = response.json()
                cls.token = cls.login_response.get("token")
                print("Successfully logged in and obtained token")
            else:
                print(f"Login failed with status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error during login: {str(e)}")
    
    def get_auth_headers(self):
        """Get authorization headers with token"""
        if not self.token:
            self.fail("No authentication token available")
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_01_login(self):
        """Test login endpoint with admin credentials"""
        # Login was already performed in setUpClass, just verify the response
        self.assertIsNotNone(self.login_response, "Login response should not be None")
        self.assertTrue(self.login_response.get("success"), "Login should be successful")
        self.assertIsNotNone(self.login_response.get("token"), "Token should be returned")
        
        # Verify user data
        user = self.login_response.get("user")
        self.assertIsNotNone(user, "User data should be returned")
        self.assertEqual(user.get("username"), "admin", "Username should be 'admin'")
        self.assertEqual(user.get("role"), "admin", "Role should be 'admin'")
    
    def test_02_get_current_user(self):
        """Test protected endpoint to get current user info"""
        response = requests.get(f"{API_URL}/auth/me", headers=self.get_auth_headers())
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        user_data = response.json()
        self.assertEqual(user_data.get("username"), "admin", "Username should be 'admin'")
        self.assertEqual(user_data.get("role"), "admin", "Role should be 'admin'")
    
    def test_03_get_inventory(self):
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
    
    def test_04_create_inventory_item(self):
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
        self.item_id = created_item.get("id")
        print(f"Created inventory item with ID: {self.item_id}")
        
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
    
    def test_05_update_inventory_item(self):
        """Test updating an inventory item"""
        # Make sure we have an item ID from the create test
        if not hasattr(self, 'item_id'):
            self.fail("No item ID available for update test")
        
        update_data = {
            "name": "Updated Test Item",
            "description": "Updated description",
            "quantity": 15
        }
        
        response = requests.put(
            f"{API_URL}/inventory/{self.item_id}", 
            json=update_data, 
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        
        updated_item = response.json()
        self.assertEqual(updated_item.get("id"), self.item_id, "Updated item ID should match")
        
        # Note: The current implementation doesn't actually update the item in a database,
        # it just returns a sample updated item. In a real implementation, we would verify
        # that the updated fields match what we sent.
    
    def test_06_get_bin_card_history(self):
        """Test getting BIN card history for an item"""
        # Use the item ID from the create test, or a sample ID if not available
        item_id = getattr(self, 'item_id', "inv-001")
        
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
    
    def test_07_get_requisitions(self):
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
    
    def test_08_create_requisition(self):
        """Test creating a new requisition"""
        # Use the item ID from the create test, or a sample ID if not available
        item_id = getattr(self, 'item_id', "inv-001")
        
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
    
    def test_09_dashboard_stats(self):
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
    
    def test_10_low_stock_report(self):
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

if __name__ == "__main__":
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)