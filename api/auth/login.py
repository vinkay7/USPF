from http.server import BaseHTTPRequestHandler
import json
import os
import jwt
from datetime import datetime, timedelta
import logging

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "uspf-inventory-jwt-secret-key-2025-production-secure")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

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

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            request_data = json.loads(post_data)
            
            username = request_data.get('username')
            password = request_data.get('password')
            
            # Hardcoded uspf credentials
            if username == "uspf" and password == "uspf":
                # User data for token payload
                user_data = {
                    "user_id": "uspf-001",
                    "username": "uspf", 
                    "role": "admin",
                    "department": "secretariat",
                    "full_name": "USPF Administrator"
                }
                
                # Create tokens
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": username, **user_data},
                    expires_delta=access_token_expires
                )
                
                refresh_token = create_refresh_token(
                    data={"sub": username, **user_data}
                )
                
                logger.info(f"Successful login for user: {username}")
                
                response = {
                    "success": True,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "user": user_data,
                    "message": "Login successful"
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            else:
                logger.warning(f"Failed login attempt for username: {username}")
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.send_header('WWW-Authenticate', 'Bearer')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Invalid username or password"}).encode())
                
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Login failed"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()