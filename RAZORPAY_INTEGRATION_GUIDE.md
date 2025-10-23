# Razorpay Integration Guide - Production Ready

## Overview
This guide provides a complete production-ready Razorpay integration with 90% discount coupon system for the Pebly URL shortener application.

## Features Implemented
- ✅ Razorpay payment gateway integration
- ✅ 90% discount coupon "VENAKT90"
- ✅ Real-time payment verification
- ✅ Subscription management
- ✅ Webhook handling for payment events
- ✅ Secure payment processing
- ✅ Mobile-responsive payment UI

## Backend Setup

### 1. Dependencies Added
```xml
<dependency>
    <groupId>com.razorpay</groupId>
    <artifactId>razorpay-java</artifactId>
    <version>1.4.3</version>
</dependency>
```

### 2. Configuration (application.yml)
```yaml
razorpay:
  key:
    id: ${RAZORPAY_KEY_ID:}
    secret: ${RAZORPAY_KEY_SECRET:}
```

### 3. Environment Variables Required
```bash
# Razorpay Credentials (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# For production
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_secret_key
```

## Frontend Setup

### 1. Add Razorpay Script
Add to your `public/index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Environment Variables
```bash
# Frontend .env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id
REACT_APP_API_URL=http://localhost:8080/api
```

## API Endpoints

### 1. Create Payment Order
```
POST /api/v1/payments/create-order
Content-Type: application/json

{
  "amount": 29900,  // Amount in paise (₹299.00)
  "currency": "INR",
  "planType": "MONTHLY",
  "planName": "Premium Monthly",
  "couponCode": "VENAKT90",  // Optional
  "userId": "user-id"
}
```

### 2. Verify Payment
```
POST /api/v1/payments/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "signature_xyz",
  "planType": "MONTHLY",
  "userId": "user-id"
}
```

### 3. Validate Coupon
```
POST /api/v1/payments/validate-coupon
Content-Type: application/json

{
  "couponCode": "VENAKT90",
  "amount": 29900
}
```

### 4. Get Subscription Status
```
GET /api/v1/payments/subscription-status/{userId}
```

## Coupon System

### VENAKT90 Coupon
- **Discount**: 90% off on all plans
- **Code**: VENAKT90 (case-insensitive)
- **Type**: Percentage discount
- **Usage**: Unlimited (can be restricted in future)

### Pricing with Coupon
- Premium Monthly: ₹299 → ₹30 (90% off)
- Premium Yearly: ₹2,499 → ₹250 (90% off)
- Lifetime: ₹9,999 → ₹1,000 (90% off)

## Security Features

### 1. Payment Verification
- Server-side signature verification
- Order validation before payment
- Secure webhook handling

### 2. Webhook Security
```java
// Webhook endpoint with signature verification
@PostMapping("/webhook")
public ResponseEntity<String> handleWebhook(
    @RequestBody String payload,
    @RequestHeader("X-Razorpay-Signature") String signature
) {
    boolean isValid = paymentService.verifyWebhookSignature(payload, signature);
    // Process only if signature is valid
}
```

## Production Deployment Steps

### 1. Razorpay Account Setup
1. Create Razorpay account at https://razorpay.com
2. Complete KYC verification
3. Get API keys from Dashboard → Settings → API Keys
4. Set up webhooks in Dashboard → Settings → Webhooks

### 2. Webhook Configuration
- **URL**: `https://your-domain.com/api/v1/payments/webhook`
- **Events**: `payment.captured`, `payment.failed`, `order.paid`
- **Secret**: Generate and store securely

### 3. Environment Variables (Production)
```bash
# Backend
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
MONGODB_URI=mongodb://your-production-db
FRONTEND_URL=https://your-frontend-domain.com

# Frontend
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_live_key
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### 4. SSL Certificate
- Ensure HTTPS is enabled for both frontend and backend
- Razorpay requires HTTPS for production

## Testing

### 1. Test Cards (Razorpay Test Mode)
```
Success: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date

Failure: 4000 0000 0000 0002
```

### 2. Test UPI IDs
```
Success: success@razorpay
Failure: failure@razorpay
```

## Error Handling

### Common Error Scenarios
1. **Payment Failed**: Show user-friendly message, allow retry
2. **Network Issues**: Implement retry mechanism
3. **Signature Verification Failed**: Log for security review
4. **Invalid Coupon**: Clear error message to user

### Error Response Format
```json
{
  "success": false,
  "message": "Payment verification failed",
  "errorCode": "PAYMENT_VERIFICATION_FAILED"
}
```

## Monitoring & Analytics

### 1. Payment Metrics
- Success rate tracking
- Failed payment analysis
- Coupon usage statistics
- Revenue tracking

### 2. Logging
```java
// Log all payment events
logger.info("Payment initiated: orderId={}, amount={}, userId={}", 
           orderId, amount, userId);
logger.info("Payment verified: paymentId={}, orderId={}", 
           paymentId, orderId);
```

## Support & Troubleshooting

### 1. Common Issues
- **CORS errors**: Ensure proper CORS configuration
- **Signature mismatch**: Check webhook secret
- **Payment not captured**: Verify webhook handling

### 2. Razorpay Support
- Dashboard: https://dashboard.razorpay.com
- Documentation: https://razorpay.com/docs
- Support: support@razorpay.com

## Compliance & Legal

### 1. PCI DSS Compliance
- Razorpay handles PCI compliance
- Never store card details on your servers
- Use HTTPS for all payment communications

### 2. Data Protection
- Store minimal payment data
- Encrypt sensitive information
- Regular security audits

## Next Steps

1. **Deploy to staging** with test keys
2. **Test all payment flows** thoroughly
3. **Set up monitoring** and alerts
4. **Go live** with production keys
5. **Monitor** payment success rates

## Contact Information

For technical support or questions about this integration:
- Email: support@pebly.com
- Documentation: https://docs.pebly.com/payments