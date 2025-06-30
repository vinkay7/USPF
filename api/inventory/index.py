from http.server import BaseHTTPRequestHandler
import json
import os
import jwt
import uuid
import qrcode
import io
import base64
import logging
from datetime import datetime
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "uspf-inventory-jwt-secret-key-2025-production-secure")
JWT_ALGORITHM = "HS256"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_token(token: str, token_type: str = "access"):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != token_type:
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e

def authenticate_request(handler):
    """Authenticate request and return user data"""
    auth_header = handler.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, {"detail": "Authentication required"}
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = verify_token(token, "access")
        username = payload.get("sub")
        
        if username is None:
            return None, {"detail": "Invalid authentication credentials"}
        
        return {
            "id": payload.get("user_id", "uspf-001"),
            "username": username,
            "role": payload.get("role", "admin"),
            "department": payload.get("department", "secretariat"),
            "full_name": payload.get("full_name", "USPF Administrator")
        }, None
        
    except ExpiredSignatureError:
        return None, {"detail": "Token has expired"}
    except InvalidTokenError:
        return None, {"detail": "Invalid token"}
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return None, {"detail": "Invalid authentication credentials"}

def generate_qr_code(data: dict) -> str:
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
        logger.error(f"Error generating QR code: {str(e)}")
        return ""

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Authenticate request
        user, error = authenticate_request(self)
        if error:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error).encode())
            return
        
        try:
            # Sample inventory data
            sample_items = [
                {
                    "id": "inv-001",
                    "name": "HP Laptop",
                    "description": "HP EliteBook 840 G8",
                    "category": "Electronics",
                    "quantity": 25,
                    "unit_cost": 150000.0,
                    "reorder_level": 5,
                    "department": "Information Technology Project",
                    "qr_code": generate_qr_code({"id": "inv-001", "name": "HP Laptop"}),
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
                    "qr_code": generate_qr_code({"id": "inv-002", "name": "Office Chairs"}),
                    "created_at": datetime.now().isoformat()
                }
            ]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(sample_items).encode())
            
        except Exception as e:
            logger.error(f"Error fetching inventory: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to fetch inventory"}).encode())
    
    def do_POST(self):
        # Authenticate request
        user, error = authenticate_request(self)
        if error:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error).encode())
            return
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            item_data = json.loads(post_data)
            
            # Generate ID and QR code
            item_id = str(uuid.uuid4())
            qr_data = {
                "id": item_id,
                "name": item_data.get("name"),
                "category": item_data.get("category")
            }
            qr_code = generate_qr_code(qr_data)
            
            new_item = {
                "id": item_id,
                "name": item_data.get("name"),
                "description": item_data.get("description", ""),
                "category": item_data.get("category"),
                "quantity": item_data.get("quantity", 0),
                "unit_cost": item_data.get("unit_cost", 0.0),
                "reorder_level": item_data.get("reorder_level", 10),
                "department": item_data.get("department"),
                "qr_code": qr_code,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(new_item).encode())
            
        except Exception as e:
            logger.error(f"Error creating inventory item: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to create inventory item"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()