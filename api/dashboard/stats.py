from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def verify_token(self):
        """Verify authentication token"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return False
        token = auth_header.replace('Bearer ', '')
        return token == 'uspf-token'

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Get dashboard statistics"""
        if not self.verify_token():
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Authentication required"}).encode('utf-8'))
            return

        try:
            stats = {
                "total_items": 75,
                "low_stock_items": 5,
                "pending_requisitions": 8,
                "total_value": 4250000.0,
                "recent_activity": [
                    {
                        "type": "stock_received",
                        "item": "HP Laptop",
                        "quantity": 10,
                        "timestamp": "2025-01-27T10:30:00"
                    },
                    {
                        "type": "requisition_approved",
                        "item": "Office Chairs",
                        "quantity": 5,
                        "timestamp": "2025-01-27T09:15:00"
                    }
                ]
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(stats).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Failed to retrieve dashboard statistics"}).encode('utf-8'))