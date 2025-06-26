from http.server import BaseHTTPRequestHandler
import json
import uuid
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Sample requisitions data
        self.sample_requisitions = [
            {
                "id": "req-001",
                "item_id": "inv-001",
                "item_name": "HP Laptop",
                "department": "Information Technology Project",
                "requested_quantity": 3,
                "purpose": "New employee setup",
                "status": "pending",
                "requested_by": "John Doe",
                "approved_by": None,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "req-002",
                "item_id": "inv-002",
                "item_name": "Office Chairs",
                "department": "Corporate Services",
                "requested_quantity": 10,
                "purpose": "Office expansion",
                "status": "approved",
                "requested_by": "Jane Smith",
                "approved_by": "Admin",
                "created_at": datetime.now().isoformat()
            }
        ]
        super().__init__(*args, **kwargs)

    def verify_token(self):
        """Verify authentication token"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return False
        token = auth_header.replace('Bearer ', '')
        return token == 'uspf-token'

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Get all requisitions"""
        if not self.verify_token():
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Authentication required"}).encode('utf-8'))
            return

        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(self.sample_requisitions).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to retrieve requisitions"}).encode('utf-8'))

    def do_POST(self):
        """Create new requisition"""
        if not self.verify_token():
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Authentication required"}).encode('utf-8'))
            return

        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            new_requisition = {
                "id": str(uuid.uuid4()),
                "item_id": data.get("item_id"),
                "item_name": data.get("item_name", "Unknown Item"),
                "department": data.get("department"),
                "requested_quantity": data.get("requested_quantity"),
                "purpose": data.get("purpose"),
                "status": "pending",
                "requested_by": data.get("requested_by"),
                "approved_by": None,
                "created_at": datetime.now().isoformat()
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(new_requisition).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to create requisition"}).encode('utf-8'))