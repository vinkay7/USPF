from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import LoginRequest, LoginResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user with hardcoded admin credentials"""
    try:
        if request.username == "admin" and request.password == "admin":
            token = "admin-token"
            
            user_data = {
                "id": "admin-001",
                "username": "admin",
                "role": "admin",
                "department": "secretariat",
                "full_name": "System Administrator"
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

# Export the app as handler for Vercel
handler = app