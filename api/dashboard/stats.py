from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from ..models import User, get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    try:
        stats = {
            "total_items": 150,
            "total_value": 5000000.0,
            "low_stock_count": 5,
            "pending_requisitions": 8,
            "issued_today": 12,
            "recent_activities": [
                {
                    "type": "issue",
                    "item": "HP Laptop",
                    "quantity": 2,
                    "department": "IT Project",
                    "time": "2 hours ago"
                },
                {
                    "type": "receive",
                    "item": "Office Chairs",
                    "quantity": 20,
                    "department": "Corporate Services",
                    "time": "4 hours ago"
                }
            ]
        }
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard stats"
        )

handler = app