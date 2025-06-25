from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from datetime import datetime
import json
import uuid

# Sample requisitions data
SAMPLE_REQUISITIONS = [
    {
        "id": "req-001",
        "item_id": "inv-001",
        "item_name": "HP Laptop",
        "department": "Information Technology Project",
        "requested_quantity": 3,
        "purpose": "New employee setup",
        "status": "pending",
        "requested_by": "John Doe",
        "approved_by": None,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "req-002",
        "item_id": "inv-002",
        "item_name": "Office Chairs",
        "department": "Corporate Services",
        "requested_quantity": 10,
        "purpose": "Office expansion",
        "status": "approved",
        "requested_by": "Jane Smith",
        "approved_by": "Admin",
        "created_at": datetime.now().isoformat()
    }
]

def verify_token(request):
    """Verify authentication token"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    token = auth_header.replace("Bearer ", "")
    return token == "admin-token"

def handler(request):
    """Handle requisition operations"""
    # Verify authentication
    if not verify_token(request):
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    
    if request.method == "GET":
        return get_requisitions()
    elif request.method == "POST":
        return create_requisition(request)
    else:
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )

def get_requisitions():
    """Get all requisitions"""
    try:
        return JSONResponse(
            status_code=200,
            content=SAMPLE_REQUISITIONS,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve requisitions"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )

def create_requisition(request):
    """Create new requisition"""
    try:
        # Parse request body
        body = json.loads(request.body.decode()) if hasattr(request, 'body') else request.get_json()
        
        new_requisition = {
            "id": str(uuid.uuid4()),
            "item_id": body.get("item_id"),
            "item_name": body.get("item_name", "Unknown Item"),
            "department": body.get("department"),
            "requested_quantity": body.get("requested_quantity"),
            "purpose": body.get("purpose"),
            "status": "pending",
            "requested_by": body.get("requested_by"),
            "approved_by": None,
            "created_at": datetime.now().isoformat()
        }
        
        # Add to requisitions (in real app, this would be saved to database)
        SAMPLE_REQUISITIONS.append(new_requisition)
        
        return JSONResponse(
            status_code=201,
            content=new_requisition,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to create requisition"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )

# Main handler that handles all methods
def main_handler(request):
    if request.method == "OPTIONS":
        return options_handler()
    return handler(request)