from http.server import BaseHTTPRequestHandler
import json
import os
import jwt
from datetime import datetime, timedelta
import logging
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "uspf-inventory-jwt-secret-key-2025-production-secure")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_access_token(data: dict, expires_delta=None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "refresh"):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != token_type:
            raise InvalidTokenError("Invalid token type")
        return payload
    except (ExpiredSignatureError, InvalidTokenError) as e:
        raise e

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            request_data = json.loads(post_data)
            
            refresh_token = request_data.get('refresh_token')
            
            if not refresh_token:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Refresh token required"}).encode())
                return
            
            # Verify refresh token
            payload = verify_token(refresh_token, "refresh")
            username = payload.get("sub")
            
            if username is None:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.send_header('WWW-Authenticate', 'Bearer')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Invalid refresh token"}).encode())
                return
            
            # Create new access token
            user_data = {
                "user_id": payload.get("user_id"),
                "username": username,
                "role": payload.get("role"),
                "department": payload.get("department"),
                "full_name": payload.get("full_name")
            }
            
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            new_access_token = create_access_token(
                data={"sub": username, **user_data},
                expires_delta=access_token_expires
            )
            
            logger.info(f"Token refreshed for user: {username}")
            
            response = {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except ExpiredSignatureError:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Refresh token has expired"}).encode())
        except InvalidTokenError:
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Invalid refresh token"}).encode())
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            self.send_response(401)
            self.send_header('Content-type', 'application/json')
            self.send_header('WWW-Authenticate', 'Bearer')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Invalid refresh token"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()