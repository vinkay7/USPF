from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def handler(request):
    """Vercel serverless function handler for getting current user"""
    if request.method != "GET":
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )
    
    try:
        # Get authorization header
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        
        token = auth_header.replace("Bearer ", "")
        
        if token == "admin-token":
            user_data = {
                "id": "admin-001",
                "username": "admin",
                "role": "admin",
                "department": "secretariat",
                "full_name": "System Administrator"
            }
            
            return JSONResponse(
                status_code=200,
                content=user_data,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        else:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authentication credentials"},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )

# Main handler that handles both GET and OPTIONS
def main_handler(request):
    if request.method == "OPTIONS":
        return options_handler()
    return handler(request)