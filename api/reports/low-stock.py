from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import InventoryItem, User, get_current_user, generate_qr_code

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/reports/low-stock", response_model=List[InventoryItem])
async def get_low_stock_items(current_user: User = Depends(get_current_user)):
    """Get items below reorder level"""
    try:
        low_stock_items = [
            InventoryItem(
                id="inv-003",
                name="Printer Cartridges",
                description="HP LaserJet cartridges",
                category="Consumables",
                quantity=3,
                unit_cost=15000.0,
                reorder_level=10,
                department="Corporate Services",
                qr_code=generate_qr_code({"id": "inv-003", "name": "Printer Cartridges"}),
                created_at=datetime.now()
            )
        ]
        return low_stock_items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch low stock items"
        )

handler = app