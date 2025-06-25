from fastapi.responses import JSONResponse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import InventoryItem, generate_qr_code
from datetime import datetime
import json
import uuid

# Sample inventory data
SAMPLE_INVENTORY = [
    {
        "id": "inv-001",
        "name": "HP Laptop",
        "description": "HP EliteBook 840 G8",
        "category": "Electronics",
        "quantity": 25,
        "unit_cost": 150000.0,
        "reorder_level": 5,
        "department": "Information Technology Project",
        "qr_code": "",
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
        "qr_code": "",
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
    """Handle inventory operations"""
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
        return get_inventory()
    elif request.method == "POST":
        return create_inventory_item(request)
    else:
        return JSONResponse(
            status_code=405,
            content={"detail": "Method not allowed"}
        )

def get_inventory():
    """Get all inventory items"""
    try:
        # Generate QR codes for items that don't have them
        for item in SAMPLE_INVENTORY:
            if not item.get("qr_code"):
                item["qr_code"] = generate_qr_code({"id": item["id"], "name": item["name"]})
        
        return JSONResponse(
            status_code=200,
            content=SAMPLE_INVENTORY,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve inventory"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )

def create_inventory_item(request):
    """Create new inventory item"""
    try:
        # Parse request body
        body = json.loads(request.body.decode()) if hasattr(request, 'body') else request.get_json()
        
        new_item = {
            "id": str(uuid.uuid4()),
            "name": body.get("name"),
            "description": body.get("description", ""),
            "category": body.get("category"),
            "quantity": body.get("quantity", 0),
            "unit_cost": body.get("unit_cost", 0.0),
            "reorder_level": body.get("reorder_level", 10),
            "department": body.get("department"),
            "qr_code": "",
            "created_at": datetime.now().isoformat()
        }
        
        # Generate QR code
        new_item["qr_code"] = generate_qr_code({"id": new_item["id"], "name": new_item["name"]})
        
        # Add to inventory (in real app, this would be saved to database)
        SAMPLE_INVENTORY.append(new_item)
        
        return JSONResponse(
            status_code=201,
            content=new_item,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to create inventory item"},
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