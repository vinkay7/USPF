from fastapi.responses import JSONResponse
from datetime import datetime

def handler(request):
    """Health check endpoint"""
    if request.method != "GET":
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )
    
    try:
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "service": "USPF Inventory Management API",
                "version": "1.0.0"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Health check failed"},
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