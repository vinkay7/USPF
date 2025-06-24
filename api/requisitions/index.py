from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from ..models import RequisitionRequest, User, get_current_user, SAMPLE_REQUISITIONS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/requisitions", response_model=List[RequisitionRequest])
async def get_requisitions(current_user: User = Depends(get_current_user)):
    """Get all requisition requests"""
    try:
        return SAMPLE_REQUISITIONS
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch requisitions"
        )

handler = app