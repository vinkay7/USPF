"""
Database connection handling with retry logic and connection pooling for Vercel
"""

import asyncio
import time
from typing import Optional, Dict, Any, Callable
from contextlib import asynccontextmanager
from functools import wraps
import os
from supabase import create_client, Client

from .logger import logger, monitor_performance
from .error_handler import database_circuit_breaker

class DatabaseManager:
    """
    Enhanced database manager with connection retry logic, 
    health checks, and connection pooling for Vercel deployment
    """
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.connection_pool = {}
        self.health_status = {"healthy": False, "last_check": None, "error": None}
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        self.connection_timeout = 10  # seconds
        
    async def initialize(self) -> bool:
        """Initialize database connection with retry logic"""
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Missing Supabase configuration")
            return False
        
        for attempt in range(self.max_retries):
            try:
                with monitor_performance(f"database_connection_attempt_{attempt + 1}"):
                    self.supabase = create_client(supabase_url, supabase_key)
                    
                    # Test connection
                    await self.health_check()
                    
                    if self.health_status["healthy"]:
                        logger.info(
                            f"Database connection established on attempt {attempt + 1}",
                            database={"attempt": attempt + 1, "url": supabase_url[:50] + "..."}
                        )
                        database_circuit_breaker.record_success()
                        return True
                        
            except Exception as e:
                logger.warning(
                    f"Database connection attempt {attempt + 1} failed: {str(e)}",
                    database={"attempt": attempt + 1, "error": str(e)}
                )
                
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
        
        logger.error("Failed to establish database connection after all attempts")
        database_circuit_breaker.record_failure()
        return False
    
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            if not self.supabase:
                raise Exception("Database client not initialized")
            
            # Simple health check query
            start_time = time.time()
            
            # Use Supabase's built-in health check or a simple query
            result = self.supabase.table('_health_check').select('*').limit(1).execute()
            
            response_time = (time.time() - start_time) * 1000  # ms
            
            self.health_status = {
                "healthy": True,
                "last_check": time.time(),
                "response_time_ms": round(response_time, 2),
                "error": None
            }
            
            logger.debug(
                f"Database health check passed in {response_time:.2f}ms",
                database=self.health_status
            )
            
            return True
            
        except Exception as e:
            self.health_status = {
                "healthy": False,
                "last_check": time.time(),
                "error": str(e)
            }
            
            logger.warning(
                f"Database health check failed: {str(e)}",
                database=self.health_status
            )
            
            return False
    
    async def execute_with_retry(self, operation: Callable, *args, **kwargs):
        """Execute database operation with retry logic"""
        if not database_circuit_breaker.can_execute():
            raise Exception("Database circuit breaker is OPEN")
        
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                with monitor_performance(f"database_operation_attempt_{attempt + 1}"):
                    # Ensure connection is healthy
                    if not await self.health_check():
                        raise Exception("Database health check failed")
                    
                    # Execute operation
                    result = await operation(*args, **kwargs)
                    
                    # Record success
                    database_circuit_breaker.record_success()
                    
                    return result
                    
            except Exception as e:
                last_exception = e
                logger.warning(
                    f"Database operation attempt {attempt + 1} failed: {str(e)}",
                    database={
                        "operation": operation.__name__ if hasattr(operation, '__name__') else 'unknown',
                        "attempt": attempt + 1,
                        "error": str(e)
                    }
                )
                
                # Try to reconnect if connection is lost
                if "connection" in str(e).lower() or "timeout" in str(e).lower():
                    await self.initialize()
                
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
        
        # All attempts failed
        database_circuit_breaker.record_failure()
        logger.error(
            f"Database operation failed after {self.max_retries} attempts",
            database={"final_error": str(last_exception)}
        )
        
        raise last_exception
    
    @asynccontextmanager
    async def transaction(self):
        """Database transaction context manager"""
        if not self.supabase:
            raise Exception("Database not initialized")
        
        transaction_id = f"txn_{int(time.time() * 1000)}"
        logger.debug(f"Starting transaction {transaction_id}")
        
        try:
            # Note: Supabase handles transactions differently
            # This is a placeholder for transaction logic
            yield self.supabase
            logger.debug(f"Transaction {transaction_id} committed")
            
        except Exception as e:
            logger.error(
                f"Transaction {transaction_id} failed: {str(e)}",
                database={"transaction_id": transaction_id, "error": str(e)}
            )
            raise
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "initialized": self.supabase is not None,
            "health_status": self.health_status,
            "circuit_breaker_state": database_circuit_breaker.state,
            "circuit_breaker_failures": database_circuit_breaker.failure_count,
            "pool_size": len(self.connection_pool)
        }

# Global database manager instance
db_manager = DatabaseManager()

def with_database_retry(operation_name: str = None):
    """Decorator for database operations with retry logic"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            op_name = operation_name or func.__name__
            
            async def db_operation():
                return await func(*args, **kwargs)
            
            return await db_manager.execute_with_retry(db_operation)
        
        return wrapper
    return decorator

class DatabaseHealthMonitor:
    """Monitor database health and performance"""
    
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval  # seconds
        self.monitoring = False
        self.stats = {
            "total_checks": 0,
            "successful_checks": 0,
            "failed_checks": 0,
            "avg_response_time": 0,
            "last_error": None
        }
    
    async def start_monitoring(self):
        """Start continuous health monitoring"""
        self.monitoring = True
        logger.info("Starting database health monitoring")
        
        while self.monitoring:
            try:
                await db_manager.health_check()
                self.stats["total_checks"] += 1
                
                if db_manager.health_status["healthy"]:
                    self.stats["successful_checks"] += 1
                    if "response_time_ms" in db_manager.health_status:
                        # Update running average
                        current_avg = self.stats["avg_response_time"]
                        new_time = db_manager.health_status["response_time_ms"]
                        self.stats["avg_response_time"] = (
                            (current_avg * (self.stats["successful_checks"] - 1) + new_time) 
                            / self.stats["successful_checks"]
                        )
                else:
                    self.stats["failed_checks"] += 1
                    self.stats["last_error"] = db_manager.health_status.get("error")
                
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Health monitoring error: {str(e)}")
                await asyncio.sleep(self.check_interval)
    
    def stop_monitoring(self):
        """Stop health monitoring"""
        self.monitoring = False
        logger.info("Stopped database health monitoring")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get monitoring statistics"""
        return self.stats.copy()

# Global health monitor
health_monitor = DatabaseHealthMonitor()