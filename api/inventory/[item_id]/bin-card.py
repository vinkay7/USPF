from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from ...models import BinCardEntry, User, get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/inventory/{item_id}/bin-card", response_model=List[BinCardEntry])
async def get_bin_card_history(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get BIN card history for an inventory item"""
    try:
        sample_entries = [
            BinCardEntry(
                id="bin-001",
                item_id=item_id,
                transaction_type="receive",
                quantity=50,
                balance=50,
                reference_number="PO-2024-001",
                department="Procurement",
                remarks="Initial stock",
                created_at=datetime.now()
            ),
            BinCardEntry(
                id="bin-002",
                item_id=item_id,
                transaction_type="issue",
                quantity=5,
                balance=45,
                reference_number="SIV-2024-001",
                department="Information Technology Project",
                remarks="Issued for project setup",
                created_at=datetime.now()
            )
        ]
        return sample_entries
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch BIN card history"
        )

handler = app