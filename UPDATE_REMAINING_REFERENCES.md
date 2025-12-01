# 🔄 Update Remaining References - Quick Guide

## ✅ Already Updated

### **Landing Page** ✅
- Logo/Brand name: "TinySlash"
- Example URL: `tinyslash.com/abc123`
- All "Pebly" references changed to "TinySlash"

### **Main Pages** ✅
- Home page: "Welcome to TinySlash"
- Analytics page: URLs updated to tinyslash.com

---

## 📧 Email Addresses to Update

Run these find/replace commands in your frontend:

### **Support Emails:**
```bash
# Find and replace in all files
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/support@pebly\.com/support@tinyslash.com/g' {} +
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hello@pebly\.in/hello@tinyslash.com/g' {} +
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/legal@pebly\.com/legal@tinyslash.com/g' {} +
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/privacy@pebly\.com/privacy@tinyslash.com/g' {} +
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/dpo@pebly\.com/dpo@tinyslash.com/g' {} +
```

### **Domain References:**
```bash
# Replace pebly.com with tinyslash.com
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/pebly\.com/tinyslash.com/g' {} +
```

### **Brand Name:**
```bash
# Replace remaining "Pebly" with "TinySlash"
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/Pebly/TinySlash/g' {} +
```

---

## 📝 Files That Need Manual Review

### **1. Legal Pages**
- `frontend/src/pages/TermsAndConditions.tsx`
- `frontend/src/pages/PrivacyPolicy.tsx`
- `frontend/src/pages/CancellationRefund.tsx`
- `frontend/src/pages/ShippingPolicy.tsx`

**Changes needed:**
- Company name: "TinySlash"
- Email addresses
- Domain references
- Legal entity information

### **2. Contact Pages**
- `frontend/src/pages/ContactUs.tsx`

**Changes needed:**
- Support email: `support@tinyslash.com`
- Company information

### **3. Other Pages**
- `frontend/src/pages/TeamInvite.tsx` - "invited to join a team on TinySlash"
- `frontend/src/pages/AuthCallback.tsx` - "Welcome to TinySlash!"
- `frontend/src/pages/Pricing.tsx` - "Welcome to TinySlash Premium!"

---

## 🚀 Quick Update Script

Create a file `update-branding.sh`:

```bash
#!/bin/bash

echo "🔄 Updating TinySlash branding..."

cd frontend/src

# Update email addresses
echo "📧 Updating email addresses..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/support@pebly\.com/support@tinyslash.com/g' {} +
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hello@pebly\.in/hello@tinyslash.com/g' {} +
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/legal@pebly\.com/legal@tinyslash.com/g' {} +
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/privacy@pebly\.com/privacy@tinyslash.com/g' {} +
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/dpo@pebly\.com/dpo@tinyslash.com/g' {} +

# Update domain references
echo "🌐 Updating domain references..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/pebly\.com/tinyslash.com/g' {} +
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/pebly\.vercel\.app/tinyslash.com/g' {} +

# Update brand name
echo "🎨 Updating brand name..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/Pebly/TinySlash/g' {} +

echo "✅ Branding update complete!"
echo ""
echo "📝 Please manually review these files:"
echo "  - pages/TermsAndConditions.tsx"
echo "  - pages/PrivacyPolicy.tsx"
echo "  - pages/CancellationRefund.tsx"
echo "  - pages/ShippingPolicy.tsx"
echo "  - pages/ContactUs.tsx"
echo ""
echo "🚀 Ready to deploy!"
```

Make it executable and run:
```bash
chmod +x update-branding.sh
./update-branding.sh
```

---

## ✅ Verification Checklist

After running the script, verify:

- [ ] All "Pebly" changed to "TinySlash"
- [ ] All `pebly.com` changed to `tinyslash.com`
- [ ] All `pebly.vercel.app` changed to `tinyslash.com`
- [ ] All email addresses updated
- [ ] Legal pages reviewed
- [ ] Contact information updated
- [ ] No broken links
- [ ] Logo displays correctly
- [ ] Favicon shows in browser

---

## 🎯 Final Test

```bash
# Search for any remaining "pebly" references
cd frontend/src
grep -r "pebly" . --include="*.tsx" --include="*.ts" -i

# Should return minimal or no results
```

---

**Run the script and your frontend will be 100% TinySlash branded!** 🚀
