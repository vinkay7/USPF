"""
Advanced logging system optimized for Vercel deployment
Supports structured JSON logging, performance monitoring, and error tracking.
"""

import json
import logging
import time
import traceback
import psutil
import os
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager
from functools import wraps

class VercelLogger:
    """
    Advanced logger designed for Vercel serverless functions
    Features:
    - Structured JSON logging
    - Performance metrics
    - Memory usage tracking
    - Request/response logging
    - Error correlation
    """
    
    def __init__(self, name: str = "uspf-inventory"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Remove existing handlers to avoid duplicates
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Create JSON formatter for structured logging
        handler = logging.StreamHandler()
        handler.setFormatter(self.JSONFormatter())
        self.logger.addHandler(handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
        
    class JSONFormatter(logging.Formatter):
        """Custom JSON formatter for structured logging"""
        
        def format(self, record):
            log_data = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": record.levelname,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }
            
            # Add extra fields if present
            if hasattr(record, 'request_id'):
                log_data['request_id'] = record.request_id
            if hasattr(record, 'user_id'):
                log_data['user_id'] = record.user_id
            if hasattr(record, 'performance'):
                log_data['performance'] = record.performance
            if hasattr(record, 'memory'):
                log_data['memory'] = record.memory
            if hasattr(record, 'error_details'):
                log_data['error'] = record.error_details
                
            # Add exception info if present
            if record.exc_info:
                log_data['exception'] = {
                    'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                    'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                    'traceback': traceback.format_exception(*record.exc_info)
                }
            
            return json.dumps(log_data)
    
    def get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage statistics"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            return {
                "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
                "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
                "percent": round(process.memory_percent(), 2)
            }
        except Exception:
            return {"error": "Unable to get memory info"}
    
    def log_with_context(self, level: str, message: str, **kwargs):
        """Log with additional context"""
        extra = {
            'memory': self.get_memory_usage(),
            **kwargs
        }
        getattr(self.logger, level.lower())(message, extra=extra)
    
    def info(self, message: str, **kwargs):
        self.log_with_context('INFO', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.log_with_context('WARNING', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.log_with_context('ERROR', message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        self.log_with_context('CRITICAL', message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.log_with_context('DEBUG', message, **kwargs)

# Global logger instance
logger = VercelLogger()

class PerformanceMonitor:
    """Context manager for monitoring function performance"""
    
    def __init__(self, operation_name: str, logger_instance: VercelLogger = None):
        self.operation_name = operation_name
        self.logger = logger_instance or logger
        self.start_time = None
        self.start_memory = None
    
    def __enter__(self):
        self.start_time = time.time()
        self.start_memory = self.logger.get_memory_usage()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = time.time()
        end_memory = self.logger.get_memory_usage()
        
        duration = round((end_time - self.start_time) * 1000, 2)  # ms
        
        performance_data = {
            "operation": self.operation_name,
            "duration_ms": duration,
            "memory_start": self.start_memory,
            "memory_end": end_memory,
            "success": exc_type is None
        }
        
        if exc_type:
            performance_data["error_type"] = exc_type.__name__
            performance_data["error_message"] = str(exc_val)
        
        self.logger.info(
            f"Operation '{self.operation_name}' completed in {duration}ms",
            performance=performance_data
        )

def monitor_performance(operation_name: str):
    """Decorator for monitoring function performance"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            with PerformanceMonitor(operation_name):
                return await func(*args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with PerformanceMonitor(operation_name):
                return func(*args, **kwargs)
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

@contextmanager
def log_context(request_id: str = None, user_id: str = None):
    """Context manager for adding request context to logs"""
    old_factory = logging.getLogRecordFactory()
    
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        if request_id:
            record.request_id = request_id
        if user_id:
            record.user_id = user_id
        return record
    
    logging.setLogRecordFactory(record_factory)
    try:
        yield
    finally:
        logging.setLogRecordFactory(old_factory)

class ErrorTracker:
    """Track and categorize errors for better debugging"""
    
    def __init__(self):
        self.error_counts = {}
        self.logger = logger
    
    def track_error(self, error: Exception, context: Dict[str, Any] = None):
        """Track an error with context"""
        error_type = type(error).__name__
        error_message = str(error)
        
        # Increment error count
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        error_details = {
            "type": error_type,
            "message": error_message,
            "count": self.error_counts[error_type],
            "context": context or {},
            "traceback": traceback.format_exc()
        }
        
        self.logger.error(
            f"Error tracked: {error_type} - {error_message}",
            error_details=error_details
        )
        
        return error_details
    
    def get_error_summary(self) -> Dict[str, int]:
        """Get summary of tracked errors"""
        return self.error_counts.copy()

# Global error tracker
error_tracker = ErrorTracker()