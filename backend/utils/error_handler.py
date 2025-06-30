"""
Global error handling and crash prevention system for Vercel deployment
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Dict, Any
import traceback
import asyncio
from datetime import datetime

from .logger import logger, error_tracker

class ErrorHandler:
    """Centralized error handling for the application"""
    
    @staticmethod
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors"""
        error_details = {
            "type": "validation_error",
            "url": str(request.url),
            "method": request.method,
            "errors": exc.errors()
        }
        
        logger.warning(
            f"Validation error on {request.method} {request.url.path}",
            error_details=error_details
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Validation Error",
                "details": exc.errors(),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        error_details = {
            "type": "http_error",
            "status_code": exc.status_code,
            "url": str(request.url),
            "method": request.method,
            "detail": exc.detail
        }
        
        logger.warning(
            f"HTTP {exc.status_code} error on {request.method} {request.url.path}: {exc.detail}",
            error_details=error_details
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "status_code": exc.status_code,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle Starlette HTTP exceptions"""
        error_details = {
            "type": "starlette_error",
            "status_code": exc.status_code,
            "url": str(request.url),
            "method": request.method,
            "detail": exc.detail
        }
        
        logger.warning(
            f"Starlette {exc.status_code} error on {request.method} {request.url.path}: {exc.detail}",
            error_details=error_details
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "status_code": exc.status_code,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        error_id = f"error_{int(datetime.utcnow().timestamp())}"
        
        error_details = error_tracker.track_error(exc, {
            "error_id": error_id,
            "url": str(request.url),
            "method": request.method,
            "headers": dict(request.headers),
            "client": request.client.host if request.client else None
        })
        
        logger.critical(
            f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}",
            error_details=error_details,
            exc_info=True
        )
        
        # Return user-friendly error without exposing internal details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Internal Server Error",
                "error_id": error_id,
                "message": "An unexpected error occurred. Please try again later.",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

class CircuitBreaker:
    """Circuit breaker pattern to prevent cascading failures"""
    
    def __init__(self, failure_threshold: int = 5, timeout_duration: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout_duration = timeout_duration
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        
    def can_execute(self) -> bool:
        """Check if operation can be executed"""
        if self.state == "CLOSED":
            return True
        elif self.state == "OPEN":
            if self.last_failure_time and \
               (datetime.utcnow() - self.last_failure_time).seconds >= self.timeout_duration:
                self.state = "HALF_OPEN"
                return True
            return False
        elif self.state == "HALF_OPEN":
            return True
        return False
    
    def record_success(self):
        """Record successful operation"""
        self.failure_count = 0
        self.state = "CLOSED"
        logger.info("Circuit breaker reset to CLOSED state")
    
    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures",
                circuit_breaker={
                    "state": self.state,
                    "failure_count": self.failure_count,
                    "threshold": self.failure_threshold
                }
            )

class GracefulShutdown:
    """Handle graceful shutdown for Vercel serverless functions"""
    
    def __init__(self):
        self.active_requests = set()
        self.shutting_down = False
    
    def add_request(self, request_id: str):
        """Add active request"""
        if not self.shutting_down:
            self.active_requests.add(request_id)
    
    def remove_request(self, request_id: str):
        """Remove completed request"""
        self.active_requests.discard(request_id)
    
    async def shutdown(self, timeout: int = 30):
        """Gracefully shutdown, waiting for active requests"""
        self.shutting_down = True
        logger.info(f"Starting graceful shutdown with {len(self.active_requests)} active requests")
        
        # Wait for active requests to complete
        start_time = asyncio.get_event_loop().time()
        while self.active_requests and (asyncio.get_event_loop().time() - start_time) < timeout:
            await asyncio.sleep(0.1)
        
        if self.active_requests:
            logger.warning(f"Shutdown timeout reached with {len(self.active_requests)} requests still active")
        else:
            logger.info("All requests completed, shutdown successful")

# Global instances
graceful_shutdown = GracefulShutdown()
database_circuit_breaker = CircuitBreaker(failure_threshold=3, timeout_duration=30)