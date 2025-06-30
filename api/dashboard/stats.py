from http.server import BaseHTTPRequestHandler
import json
import os
import jwt
import logging
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
            stats = {
                "total_items": 150,
                "total_value": 5000000.0,
                "low_stock_count": 5,
                "pending_requisitions": 8,
                "issued_today": 12,
                "recent_activities": [
                    {
                        "type": "issue",
                        "item": "HP Laptop",
                        "quantity": 2,
                        "department": "IT Project",
                        "time": "2 hours ago"
                    },
                    {
                        "type": "receive",
                        "item": "Office Chairs",
                        "quantity": 20,
                        "department": "Corporate Services",
                        "time": "4 hours ago"
                    }
                ]
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(stats).encode())
            
        except Exception as e:
            logger.error(f"Error fetching dashboard stats: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to fetch dashboard stats"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()