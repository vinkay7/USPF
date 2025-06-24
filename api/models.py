from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json
import uuid
import qrcode
import io
import base64
from supabase import create_client, Client

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else None

# Security
security = HTTPBearer(auto_error=False)

# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: Dict[str, Any]
    message: str

class InventoryItem(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: str
    quantity: int = 0
    unit_cost: float = 0.0
    reorder_level: int = 10
    department: str
    qr_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class InventoryItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category: str
    quantity: int = 0
    unit_cost: float = 0.0
    reorder_level: int = 10
    department: str

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit_cost: Optional[float] = None
    reorder_level: Optional[int] = None

class BinCardEntry(BaseModel):
    id: Optional[str] = None
    item_id: str
    transaction_type: str
    quantity: int
    balance: int
    reference_number: Optional[str] = None
    department: Optional[str] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

class RequisitionRequest(BaseModel):
    id: Optional[str] = None
    item_id: str
    department: str
    requested_quantity: int
    purpose: str
    status: str = "pending"
    requested_by: str
    approved_by: Optional[str] = None
    fulfilled_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class RequisitionCreate(BaseModel):
    item_id: str
    requested_quantity: int
    purpose: str
    requested_by: str

class RequisitionUpdate(BaseModel):
    status: str
    approved_by: Optional[str] = None
    fulfilled_by: Optional[str] = None

class User(BaseModel):
    id: str
    username: str
    role: str
    department: str
    full_name: Optional[str] = None

# Helper Functions
def generate_qr_code(data: dict) -> str:
    """Generate QR code for inventory item"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(data))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Convert to base64
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        return ""

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    """Get current user from token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if credentials.credentials == "admin-token":
        return User(
            id="admin-001",
            username="admin",
            role="admin",
            department="secretariat",
            full_name="System Administrator"
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials"
    )

# Create FastAPI app
app = FastAPI(
    title="USPF Inventory Management System",
    description="Progressive Web App for managing inventory at Universal Service Provision Fund",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for common data
SAMPLE_INVENTORY = [
    InventoryItem(
        id="inv-001",
        name="HP Laptop",
        description="HP EliteBook 840 G8",
        category="Electronics",
        quantity=25,
        unit_cost=150000.0,
        reorder_level=5,
        department="Information Technology Project",
        qr_code=generate_qr_code({"id": "inv-001", "name": "HP Laptop"}),
        created_at=datetime.now()
    ),
    InventoryItem(
        id="inv-002",
        name="Office Chairs",
        description="Ergonomic office chairs",
        category="Furniture",
        quantity=50,
        unit_cost=25000.0,
        reorder_level=10,
        department="Corporate Services",
        qr_code=generate_qr_code({"id": "inv-002", "name": "Office Chairs"}),
        created_at=datetime.now()
    )
]

SAMPLE_REQUISITIONS = [
    RequisitionRequest(
        id="req-001",
        item_id="inv-001",
        department="Information Technology Project",
        requested_quantity=3,
        purpose="New employee setup",
        status="pending",
        requested_by="John Doe",
        created_at=datetime.now()
    ),
    RequisitionRequest(
        id="req-002",
        item_id="inv-002",
        department="Corporate Services",
        requested_quantity=10,
        purpose="Office expansion",
        status="approved",
        requested_by="Jane Smith",
        approved_by="Admin",
        created_at=datetime.now()
    )
]