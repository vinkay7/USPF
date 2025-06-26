from http.server import BaseHTTPRequestHandler
import json
import uuid
from datetime import datetime
import qrcode
import io
import base64

class handler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Sample inventory data
        self.sample_inventory = [
            {
                "id": "inv-001",
                "name": "HP Laptop",
                "description": "HP EliteBook 840 G8",
                "category": "Electronics",
                "quantity": 25,
                "unit_cost": 150000.0,
                "reorder_level": 5,
                "department": "Information Technology Project",
                "qr_code": self.generate_qr_code({"id": "inv-001", "name": "HP Laptop"}),
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "inv-002",
                "name": "Office Chairs",
                "description": "Ergonomic office chairs",
                "category": "Furniture",
                "quantity": 50,
                "unit_cost": 25000.0,
                "reorder_level": 10,
                "department": "Corporate Services",
                "qr_code": self.generate_qr_code({"id": "inv-002", "name": "Office Chairs"}),
                "created_at": datetime.now().isoformat()
            }
        ]
        super().__init__(*args, **kwargs)

    def generate_qr_code(self, data):
        """Generate QR code for inventory item"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(json.dumps(data))
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Convert to base64
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_base64}"
        except Exception as e:
            return ""

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
        """Get all inventory items"""
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
            self.wfile.write(json.dumps(self.sample_inventory).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to retrieve inventory"}).encode('utf-8'))

    def do_POST(self):
        """Create new inventory item"""
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
            
            new_item = {
                "id": str(uuid.uuid4()),
                "name": data.get("name"),
                "description": data.get("description", ""),
                "category": data.get("category"),
                "quantity": data.get("quantity", 0),
                "unit_cost": data.get("unit_cost", 0.0),
                "reorder_level": data.get("reorder_level", 10),
                "department": data.get("department"),
                "qr_code": self.generate_qr_code({"id": str(uuid.uuid4()), "name": data.get("name")}),
                "created_at": datetime.now().isoformat()
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(new_item).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to create inventory item"}).encode('utf-8'))