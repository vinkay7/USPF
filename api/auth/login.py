from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import LoginRequest, LoginResponse

def handler(request):
    """Vercel serverless function handler for login"""
    if request.method != "POST":
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )
    
    try:
        # Parse request body
        import json
        body = json.loads(request.body.decode()) if hasattr(request, 'body') else request.get_json()
        
        username = body.get("username")
        password = body.get("password")
        
        if username == "admin" and password == "admin":
            token = "admin-token"
            
            user_data = {
                "id": "admin-001",
                "username": "admin",
                "role": "admin",
                "department": "secretariat",
                "full_name": "System Administrator"
            }
            
            response_data = {
                "success": True,
                "token": token,
                "user": user_data,
                "message": "Login successful"
            }
            
            return JSONResponse(
                status_code=200,
                content=response_data,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        else:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid username or password"},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Login failed"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )

# Handle OPTIONS requests for CORS
def options_handler():
    return JSONResponse(
        status_code=200,
        content="",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )

# Main handler that handles both POST and OPTIONS
def main_handler(request):
    if request.method == "OPTIONS":
        return options_handler()
    return handler(request)