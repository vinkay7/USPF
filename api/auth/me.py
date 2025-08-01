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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Get authorization header
            auth_header = self.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.send_header('WWW-Authenticate', 'Bearer')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Authentication required"}).encode())
                return
            
            token = auth_header.split(' ')[1]
            
            # Verify the JWT token
            payload = verify_token(token, "access")
            username = payload.get("sub")
            
            if username is None:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.send_header('WWW-Authenticate', 'Bearer')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Invalid authentication credentials"}).encode())
                return
            
            # Return user data from token payload
            user_data = {
                "id": payload.get("user_id", "uspf-001"),
                "username": username,
                "role": payload.get("role", "admin"),
                "department": payload.get("department", "secretariat"),
                "full_name": payload.get("full_name", "USPF Administrator")
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(user_data).encode())
            
        except ExpiredSignatureError:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Token has expired"}).encode())
        except InvalidTokenError:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Invalid token"}).encode())
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Invalid authentication credentials"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()