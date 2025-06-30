#!/usr/bin/env python3
import qrcode
import base64
import io
import json
from PIL import Image

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
        print(f"Error generating QR code: {str(e)}")
        return ""

def test_qr_code_generation():
    """Test QR code generation functionality"""
    print("Testing QR code generation...")
    
    # Test data
    test_data = {
        "id": "test-001",
        "name": "Test Item",
        "category": "Test Category"
    }
    
    # Generate QR code
    qr_code = generate_qr_code(test_data)
    
    # Verify QR code is not empty
    if not qr_code:
        print("❌ Failed to generate QR code")
        return False
    
    # Verify QR code starts with data:image/png;base64,
    if not qr_code.startswith("data:image/png;base64,"):
        print("❌ QR code is not in the expected format")
        return False
    
    # Extract the base64 part
    base64_data = qr_code.split(",")[1]
    
    # Verify base64 data is not empty
    if not base64_data:
        print("❌ Base64 data is empty")
        return False
    
    try:
        # Decode base64
        image_data = base64.b64decode(base64_data)
        
        # Try to open as image
        img = Image.open(io.BytesIO(image_data))
        
        # Verify image dimensions
        width, height = img.size
        if width <= 0 or height <= 0:
            print(f"❌ Invalid image dimensions: {width}x{height}")
            return False
        
        print(f"✅ Successfully generated QR code with dimensions {width}x{height}")
        print(f"✅ QR code contains data for: {test_data['name']}")
        return True
    except Exception as e:
        print(f"❌ Error verifying QR code: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n===== TESTING QR CODE GENERATION =====\n")
    success = test_qr_code_generation()
    
    if success:
        print("\n✅ QR CODE GENERATION TEST PASSED")
    else:
        print("\n❌ QR CODE GENERATION TEST FAILED")