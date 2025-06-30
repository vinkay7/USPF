"""
Custom middleware for request/response logging, performance monitoring, and timeout handling
"""

import time
import uuid
import asyncio
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import json

from .logger import logger, log_context, PerformanceMonitor
from .error_handler import graceful_shutdown

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests and responses with performance metrics"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Track request start time
        start_time = time.time()
        
        # Add request to graceful shutdown tracker
        graceful_shutdown.add_request(request_id)
        
        # Log request
        with log_context(request_id=request_id):
            # Get request body for logging (if reasonable size)
            request_body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.body()
                    if len(body) < 1000:  # Only log small bodies
                        request_body = body.decode('utf-8')
                except Exception:
                    request_body = "Unable to read body"
            
            # Log incoming request
            logger.info(
                f"Incoming {request.method} {request.url.path}",
                request_details={
                    "method": request.method,
                    "url": str(request.url),
                    "path": request.url.path,
                    "query_params": dict(request.query_params),
                    "headers": {k: v for k, v in request.headers.items() 
                              if k.lower() not in ['authorization', 'cookie']},
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "body_preview": request_body[:200] if request_body else None
                }
            )
            
            try:
                # Process request
                response = await call_next(request)
                
                # Calculate response time
                process_time = time.time() - start_time
                
                # Log response
                logger.info(
                    f"Response {response.status_code} for {request.method} {request.url.path}",
                    response_details={
                        "status_code": response.status_code,
                        "response_time_ms": round(process_time * 1000, 2),
                        "headers": dict(response.headers)
                    }
                )
                
                # Add performance headers
                response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
                response.headers["X-Request-ID"] = request_id
                
                return response
                
            except Exception as e:
                # Log error
                process_time = time.time() - start_time
                logger.error(
                    f"Request {request.method} {request.url.path} failed",
                    error_details={
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "response_time_ms": round(process_time * 1000, 2)
                    },
                    exc_info=True
                )
                raise
            
            finally:
                # Remove request from graceful shutdown tracker
                graceful_shutdown.remove_request(request_id)

class TimeoutMiddleware(BaseHTTPMiddleware):
    """Handle request timeouts to prevent Vercel function timeouts"""
    
    def __init__(self, app, timeout_seconds: int = 25):  # Vercel has 30s limit
        super().__init__(app)
        self.timeout_seconds = timeout_seconds
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            # Race between request processing and timeout
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout_seconds
            )
            return response
            
        except asyncio.TimeoutError:
            logger.warning(
                f"Request timeout after {self.timeout_seconds}s",
                timeout_details={
                    "method": request.method,
                    "path": request.url.path,
                    "timeout_seconds": self.timeout_seconds
                }
            )
            
            return JSONResponse(
                status_code=408,
                content={
                    "success": False,
                    "error": "Request Timeout",
                    "message": f"Request took longer than {self.timeout_seconds} seconds",
                    "timeout_seconds": self.timeout_seconds
                }
            )

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.clients = {}  # client_ip -> [timestamp, ...]
        self.window_size = 60  # seconds
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Initialize client if not exists
        if client_ip not in self.clients:
            self.clients[client_ip] = []
        
        # Remove old requests outside the window
        self.clients[client_ip] = [
            timestamp for timestamp in self.clients[client_ip]
            if current_time - timestamp < self.window_size
        ]
        
        # Check rate limit
        if len(self.clients[client_ip]) >= self.requests_per_minute:
            logger.warning(
                f"Rate limit exceeded for {client_ip}",
                rate_limit={
                    "client_ip": client_ip,
                    "requests_count": len(self.clients[client_ip]),
                    "limit": self.requests_per_minute,
                    "window_seconds": self.window_size
                }
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Rate Limit Exceeded",
                    "message": f"Too many requests. Limit: {self.requests_per_minute} per minute",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Add current request
        self.clients[client_ip].append(current_time)
        
        return await call_next(request)

class MemoryMonitoringMiddleware(BaseHTTPMiddleware):
    """Monitor memory usage per request"""
    
    def __init__(self, app, memory_threshold_mb: int = 400):  # Vercel typically has 512MB
        super().__init__(app)
        self.memory_threshold_mb = memory_threshold_mb
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        import psutil
        
        # Get memory usage before request
        process = psutil.Process()
        memory_before = process.memory_info().rss / 1024 / 1024  # MB
        
        response = await call_next(request)
        
        # Get memory usage after request
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_delta = memory_after - memory_before
        
        # Log memory usage
        memory_info = {
            "before_mb": round(memory_before, 2),
            "after_mb": round(memory_after, 2),
            "delta_mb": round(memory_delta, 2),
            "threshold_mb": self.memory_threshold_mb
        }
        
        if memory_after > self.memory_threshold_mb:
            logger.warning(
                f"High memory usage: {memory_after:.2f}MB (threshold: {self.memory_threshold_mb}MB)",
                memory=memory_info
            )
        
        # Add memory info to response headers for debugging
        response.headers["X-Memory-Usage"] = f"{memory_after:.2f}MB"
        response.headers["X-Memory-Delta"] = f"{memory_delta:.2f}MB"
        
        return response