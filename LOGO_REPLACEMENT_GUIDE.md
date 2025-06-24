# 🎨 Logo Replacement Guide - USPF Inventory System

## 📁 Current Logo Structure

**Current Setup**: The application uses **icon-based logos** (Building + Shield icons) created with Lucide React icons.

**Logo Location**: Icons are rendered directly in components using `<Building>` and `<Shield>` components.

---

## 🔄 How to Replace with Your Own Logo

### ✅ **Step 1: Prepare Your Logo File**

**Supported Formats:**
- `.png` (recommended for logos with transparency)
- `.jpg/.jpeg` (for logos without transparency)
- `.svg` (best for scalability)
- `.webp` (modern format, smaller file size)

**Recommended Specifications:**
- **Size**: 200x200px minimum (square format works best)
- **Background**: Transparent for `.png` files
- **File Size**: Under 100KB for fast loading

---

### ✅ **Step 2: Add Logo to Project**

**Place your logo file in:**
```
/app/frontend/src/assets/uspf-logo.png
```

**Command to add your logo:**
```bash
# Copy your logo file to the assets folder
cp /path/to/your/logo.png /app/frontend/src/assets/uspf-logo.png
```

---

### ✅ **Step 3: Update Login Page (`Login.js`)**

**File Location:** `/app/frontend/src/components/Login.js`

**Add the import at the top:**
```jsx
import logo from '../assets/uspf-logo.png';
```

**Replace the icon-based logo section:**

**Find this code (around line 36-50):**
```jsx
<div className="relative">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
        <Building className="w-8 h-8 text-white" />
    </div>
    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <Shield className="w-3 h-3 text-white" />
    </div>
</div>
```

**Replace with:**
```jsx
<img 
    src={logo} 
    alt="USPF Logo" 
    className="w-20 h-20 object-contain"
/>
```

**Also update the container div:**
```jsx
className="mx-auto w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 border-4 border-blue-100 overflow-hidden"
```

---

### ✅ **Step 4: Update Navigation Layout (`Layout.js`)**

**File Location:** `/app/frontend/src/components/Layout.js`

**Add the import at the top:**
```jsx
import logo from '../assets/uspf-logo.png';
```

**Update Desktop Sidebar Logo (around line 70):**

**Find:**
```jsx
<div className="relative">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
        <Building className="w-4 h-4 text-white" />
    </div>
    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <Shield className="w-2 h-2 text-white" />
    </div>
</div>
```

**Replace with:**
```jsx
<div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200">
    <img 
        src={logo} 
        alt="USPF Logo" 
        className="w-6 h-6 object-contain"
    />
</div>
```

**Update Mobile Sidebar Logo (around line 150):**

**Find the same icon code in the mobile sidebar section and replace with the same image code above.**

---

### ✅ **Step 5: Restart Frontend Service**

```bash
sudo supervisorctl restart frontend
```

---

## 🎯 **Quick Logo Replacement Commands**

If you have a logo file ready, run these commands:

```bash
# 1. Copy your logo to the correct folder
cp /path/to/your/logo.png /app/frontend/src/assets/uspf-logo.png

# 2. The files are already set up to use the logo from assets folder
# Just restart the frontend
sudo supervisorctl restart frontend
```

---

## 🔧 **Logo Sizing Guide**

### **Login Page Logo:**
- **Size**: `w-20 h-20` (80px x 80px)
- **Container**: 96px x 96px circle
- **Use**: `object-contain` to maintain aspect ratio

### **Navigation Logo:**
- **Size**: `w-6 h-6` (24px x 24px)
- **Container**: 32px x 32px circle
- **Use**: `object-contain` to maintain aspect ratio

### **Custom Sizing:**
```jsx
{/* Small logo */}
className="w-4 h-4 object-contain"

{/* Medium logo */}
className="w-8 h-8 object-contain"

{/* Large logo */}
className="w-16 h-16 object-contain"

{/* Extra large logo */}
className="w-24 h-24 object-contain"
```

---

## 📂 **File Structure:**

```
/app/frontend/src/
├── assets/
│   └── uspf-logo.png          # 👈 Your logo goes here
├── components/
│   ├── Login.js               # 👈 Update this file
│   └── Layout.js              # 👈 Update this file
└── ...
```

---

## ⚠️ **Important Notes:**

1. **File Naming**: Keep the filename as `uspf-logo.png` or update the import statements accordingly
2. **File Size**: Keep logo files under 100KB for fast loading
3. **Format**: PNG with transparency works best for most cases
4. **Backup**: Keep a copy of your original logo file
5. **Testing**: Always test on both desktop and mobile views

---

## 🚀 **Current Status:**

✅ **Icon-based logos** are currently active
📁 **Assets folder** is ready for your logo file
🔄 **Easy switching** between icon and image logos

**To switch to your logo**: Follow steps 2-5 above
**To switch back to icons**: The current setup is already using icons