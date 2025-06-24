from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import InventoryItem, InventoryItemCreate, User, get_current_user, generate_qr_code

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/inventory", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory item"""
    try:
        item_id = str(uuid.uuid4())
        qr_data = {
            "id": item_id,
            "name": item.name,
            "category": item.category
        }
        qr_code = generate_qr_code(qr_data)
        
        new_item = InventoryItem(
            id=item_id,
            name=item.name,
            description=item.description,
            category=item.category,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            reorder_level=item.reorder_level,
            department=item.department,
            qr_code=qr_code,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        return new_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create inventory item"
        )

handler = app