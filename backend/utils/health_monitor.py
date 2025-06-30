"""
Comprehensive health monitoring and system status tracking for Vercel deployment
"""

import time
import asyncio
import psutil
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict

from .logger import logger
from .database import db_manager
from .error_handler import error_tracker, database_circuit_breaker

@dataclass
class HealthCheckResult:
    """Individual health check result"""
    name: str
    status: str  # "healthy", "unhealthy", "warning"
    message: str
    response_time_ms: float
    timestamp: str
    details: Dict[str, Any] = None

class SystemHealthMonitor:
    """Comprehensive system health monitoring"""
    
    def __init__(self):
        self.checks_registry = {}
        self.health_history = []
        self.max_history_size = 100
        self.alert_thresholds = {
            "memory_usage_percent": 80,
            "response_time_ms": 5000,
            "error_rate_percent": 10
        }
    
    def register_check(self, name: str, check_func, timeout: int = 5):
        """Register a health check function"""
        self.checks_registry[name] = {
            "func": check_func,
            "timeout": timeout
        }
    
    async def run_check(self, name: str, check_config: Dict) -> HealthCheckResult:
        """Run a single health check"""
        start_time = time.time()
        
        try:
            # Run check with timeout
            result = await asyncio.wait_for(
                check_config["func"](),
                timeout=check_config["timeout"]
            )
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name=name,
                status="healthy",
                message="Check passed",
                response_time_ms=round(response_time, 2),
                timestamp=datetime.utcnow().isoformat(),
                details=result if isinstance(result, dict) else None
            )
            
        except asyncio.TimeoutError:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=name,
                status="unhealthy",
                message=f"Check timed out after {check_config['timeout']}s",
                response_time_ms=round(response_time, 2),
                timestamp=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=name,
                status="unhealthy",
                message=f"Check failed: {str(e)}",
                response_time_ms=round(response_time, 2),
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all registered health checks"""
        results = {}
        overall_status = "healthy"
        
        # Run all checks concurrently
        check_tasks = []
        for name, config in self.checks_registry.items():
            task = asyncio.create_task(self.run_check(name, config))
            check_tasks.append((name, task))
        
        # Wait for all checks to complete
        for name, task in check_tasks:
            try:
                result = await task
                results[name] = asdict(result)
                
                # Update overall status
                if result.status == "unhealthy":
                    overall_status = "unhealthy"
                elif result.status == "warning" and overall_status == "healthy":
                    overall_status = "warning"
                    
            except Exception as e:
                results[name] = asdict(HealthCheckResult(
                    name=name,
                    status="unhealthy",
                    message=f"Health check error: {str(e)}",
                    response_time_ms=0,
                    timestamp=datetime.utcnow().isoformat()
                ))
                overall_status = "unhealthy"
        
        # Compile overall health report
        health_report = {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": results,
            "summary": {
                "total_checks": len(results),
                "healthy": sum(1 for r in results.values() if r["status"] == "healthy"),
                "warnings": sum(1 for r in results.values() if r["status"] == "warning"),
                "unhealthy": sum(1 for r in results.values() if r["status"] == "unhealthy")
            }
        }
        
        # Store in history
        self.health_history.append(health_report)
        if len(self.health_history) > self.max_history_size:
            self.health_history.pop(0)
        
        # Log health status
        if overall_status == "healthy":
            logger.info("System health check passed", health_summary=health_report["summary"])
        else:
            logger.warning(f"System health check {overall_status}", health_report=health_report)
        
        return health_report
    
    def get_health_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get health trends over specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        recent_reports = [
            report for report in self.health_history
            if datetime.fromisoformat(report["timestamp"].replace("Z", "+00:00")) > cutoff_time
        ]
        
        if not recent_reports:
            return {"message": "No recent health data available"}
        
        # Calculate trends
        total_reports = len(recent_reports)
        healthy_count = sum(1 for r in recent_reports if r["status"] == "healthy")
        uptime_percentage = (healthy_count / total_reports) * 100 if total_reports > 0 else 0
        
        # Average response times by check
        avg_response_times = {}
        for report in recent_reports:
            for check_name, check_result in report["checks"].items():
                if check_name not in avg_response_times:
                    avg_response_times[check_name] = []
                avg_response_times[check_name].append(check_result["response_time_ms"])
        
        for check_name in avg_response_times:
            times = avg_response_times[check_name]
            avg_response_times[check_name] = {
                "average_ms": round(sum(times) / len(times), 2),
                "min_ms": min(times),
                "max_ms": max(times),
                "samples": len(times)
            }
        
        return {
            "period_hours": hours,
            "total_reports": total_reports,
            "uptime_percentage": round(uptime_percentage, 2),
            "status_distribution": {
                "healthy": sum(1 for r in recent_reports if r["status"] == "healthy"),
                "warning": sum(1 for r in recent_reports if r["status"] == "warning"),
                "unhealthy": sum(1 for r in recent_reports if r["status"] == "unhealthy")
            },
            "average_response_times": avg_response_times,
            "latest_status": recent_reports[-1]["status"] if recent_reports else "unknown"
        }

# Health check functions
async def check_system_resources():
    """Check system resource usage"""
    try:
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100
        
        status = "healthy"
        issues = []
        
        if memory_percent > 80:
            status = "warning"
            issues.append(f"High memory usage: {memory_percent:.1f}%")
        
        if cpu_percent > 80:
            status = "warning"
            issues.append(f"High CPU usage: {cpu_percent:.1f}%")
        
        if disk_percent > 90:
            status = "warning"
            issues.append(f"High disk usage: {disk_percent:.1f}%")
        
        return {
            "status": status,
            "issues": issues,
            "metrics": {
                "memory_percent": round(memory_percent, 2),
                "memory_available_mb": round(memory.available / 1024 / 1024, 2),
                "cpu_percent": round(cpu_percent, 2),
                "disk_percent": round(disk_percent, 2),
                "disk_free_gb": round(disk.free / 1024 / 1024 / 1024, 2)
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_database_health():
    """Check database connectivity and performance"""
    try:
        start_time = time.time()
        is_healthy = await db_manager.health_check()
        response_time = (time.time() - start_time) * 1000
        
        connection_stats = db_manager.get_connection_stats()
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "response_time_ms": round(response_time, 2),
            "connection_stats": connection_stats,
            "circuit_breaker": {
                "state": database_circuit_breaker.state,
                "failure_count": database_circuit_breaker.failure_count
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_error_rates():
    """Check application error rates"""
    try:
        error_summary = error_tracker.get_error_summary()
        total_errors = sum(error_summary.values())
        
        # Simple heuristic: if we have many errors, it's concerning
        status = "healthy"
        if total_errors > 50:
            status = "warning"
        elif total_errors > 100:
            status = "unhealthy"
        
        return {
            "status": status,
            "total_errors": total_errors,
            "error_breakdown": error_summary,
            "circuit_breaker_state": database_circuit_breaker.state
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def check_environment_config():
    """Check environment configuration"""
    try:
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "JWT_SECRET_KEY"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)
        
        status = "healthy" if not missing_vars else "unhealthy"
        
        return {
            "status": status,
            "missing_variables": missing_vars,
            "environment": os.environ.get("ENVIRONMENT", "unknown"),
            "python_version": os.sys.version.split()[0]
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Global health monitor instance
health_monitor = SystemHealthMonitor()

# Register default health checks
health_monitor.register_check("system_resources", check_system_resources, timeout=10)
health_monitor.register_check("database", check_database_health, timeout=15)
health_monitor.register_check("error_rates", check_error_rates, timeout=5)
health_monitor.register_check("environment", check_environment_config, timeout=5)