from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import logging
import uuid
import qrcode
import io
import base64
from supabase import create_client, Client
import json
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
import secrets

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase configuration. Please check your .env file.")

# Initialize Supabase client
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Create the main app without a prefix
app = FastAPI(
    title="USPF Inventory Management System",
    description="Progressive Web App for managing inventory at Universal Service Provision Fund",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    transaction_type: str  # 'issue', 'receive', 'adjustment'
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
    status: str = "pending"  # pending, approved, rejected, fulfilled
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
        logger.error(f"Error generating QR code: {str(e)}")
        return ""

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    """Get current user from token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # For demo purposes, we'll use a simple token validation
    # In production, you'd validate JWT tokens properly
    if credentials.credentials == "uspf-token":
        return User(
            id="uspf-001",
            username="uspf",
            role="admin",
            department="secretariat",
            full_name="USPF Administrator"
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials"
    )

# API Routes

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user with hardcoded admin credentials"""
    try:
        # Hardcoded uspf credentials as requested
        if request.username == "uspf" and request.password == "uspf":
            # Create a simple token (in production, use proper JWT)
            token = "uspf-token"
            
            user_data = {
                "id": "uspf-001",
                "username": "uspf",
                "role": "admin",
                "department": "secretariat",
                "full_name": "USPF Administrator"
            }
            
            return LoginResponse(
                success=True,
                token=token,
                user=user_data,
                message="Login successful"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: User = Depends(get_current_user)):
    """Get all inventory items"""
    try:
        # In a real implementation, we'd fetch from Supabase
        # For now, return sample data
        sample_items = [
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
        return sample_items
    except Exception as e:
        logger.error(f"Error fetching inventory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch inventory"
        )

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory item"""
    try:
        # Generate ID and QR code
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
        
        # TODO: Save to Supabase database
        # For now, just return the created item
        return new_item
    except Exception as e:
        logger.error(f"Error creating inventory item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create inventory item"
        )

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(
    item_id: str,
    updates: InventoryItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an inventory item"""
    try:
        # TODO: Implement actual update logic with Supabase
        # For now, return a sample updated item
        updated_item = InventoryItem(
            id=item_id,
            name=updates.name or "Updated Item",
            description=updates.description or "Updated description",
            category=updates.category or "Updated Category",
            quantity=updates.quantity or 0,
            unit_cost=updates.unit_cost or 0.0,
            reorder_level=updates.reorder_level or 10,
            department="Information Technology Project",
            qr_code=generate_qr_code({"id": item_id, "name": updates.name or "Updated Item"}),
            updated_at=datetime.now()
        )
        return updated_item
    except Exception as e:
        logger.error(f"Error updating inventory item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update inventory item"
        )

@api_router.get("/inventory/{item_id}/bin-card", response_model=List[BinCardEntry])
async def get_bin_card_history(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get BIN card history for an inventory item"""
    try:
        # Sample BIN card entries
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
        logger.error(f"Error fetching BIN card history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch BIN card history"
        )

@api_router.get("/requisitions", response_model=List[RequisitionRequest])
async def get_requisitions(current_user: User = Depends(get_current_user)):
    """Get all requisition requests"""
    try:
        # Sample requisitions
        sample_requisitions = [
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
        return sample_requisitions
    except Exception as e:
        logger.error(f"Error fetching requisitions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch requisitions"
        )

@api_router.post("/requisitions", response_model=RequisitionRequest)
async def create_requisition(
    requisition: RequisitionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new requisition request"""
    try:
        new_requisition = RequisitionRequest(
            id=str(uuid.uuid4()),
            item_id=requisition.item_id,
            department=current_user.department,
            requested_quantity=requisition.requested_quantity,
            purpose=requisition.purpose,
            status="pending",
            requested_by=requisition.requested_by,
            created_at=datetime.now()
        )
        
        # TODO: Save to Supabase database
        return new_requisition
    except Exception as e:
        logger.error(f"Error creating requisition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create requisition"
        )

@api_router.put("/requisitions/{requisition_id}", response_model=RequisitionRequest)
async def update_requisition(
    requisition_id: str,
    updates: RequisitionUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a requisition request (approve/reject/fulfill)"""
    try:
        # TODO: Implement actual update logic
        updated_requisition = RequisitionRequest(
            id=requisition_id,
            item_id="inv-001",
            department="Information Technology Project",
            requested_quantity=3,
            purpose="New employee setup",
            status=updates.status,
            requested_by="John Doe",
            approved_by=updates.approved_by,
            fulfilled_by=updates.fulfilled_by,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        return updated_requisition
    except Exception as e:
        logger.error(f"Error updating requisition: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update requisition"
        )

@api_router.get("/reports/low-stock", response_model=List[InventoryItem])
async def get_low_stock_items(current_user: User = Depends(get_current_user)):
    """Get items below reorder level"""
    try:
        # Sample low stock items
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
        logger.error(f"Error fetching low stock items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch low stock items"
        )

@api_router.get("/dashboard/stats")
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
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard stats"
        )

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "USPF Inventory Management API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
