from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def verify_token(request):
    """Verify authentication token"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    token = auth_header.replace("Bearer ", "")
    return token == "admin-token"

def handler(request):
    """Get dashboard statistics"""
    if request.method != "GET":
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )
    
    # Verify authentication
    if not verify_token(request):
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    
    try:
        stats = {
            "total_items": 75,
            "low_stock_items": 5,
            "pending_requisitions": 8,
            "total_value": 4250000.0,
            "recent_activity": [
                {
                    "type": "stock_received",
                    "item": "HP Laptop",
                    "quantity": 10,
                    "timestamp": "2025-01-27T10:30:00"
                },
                {
                    "type": "requisition_approved",
                    "item": "Office Chairs",
                    "quantity": 5,
                    "timestamp": "2025-01-27T09:15:00"
                }
            ]
        }
        
        return JSONResponse(
            status_code=200,
            content=stats,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve dashboard statistics"},
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