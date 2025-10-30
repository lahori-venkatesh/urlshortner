# Security Policy

## 🔒 Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it by emailing [your-email@domain.com]. All security vulnerabilities will be promptly addressed.

## 🛡️ Security Best Practices

### Environment Variables
- **NEVER** commit actual credentials to Git
- Use environment variables for all sensitive data
- Use `.env.example` files as templates
- Set `sync: false` in deployment configurations for secrets

### MongoDB Atlas Security
- Use strong passwords for database users
- Enable IP whitelisting in MongoDB Atlas
- Use connection string environment variables
- Rotate credentials regularly

### API Keys & Secrets
- Store all API keys as environment variables
- Use different keys for development and production
- Never log sensitive information
- Implement proper authentication and authorization

### Deployment Security
- Use HTTPS in production
- Enable CORS properly
- Implement rate limiting
- Use secure headers
- Regular security updates

## 🚨 What to do if credentials are exposed

1. **Immediately rotate the exposed credentials**
2. **Remove credentials from Git history**
3. **Update all deployment environments**
4. **Monitor for unauthorized access**
5. **Review access logs**

## 📋 Security Checklist

- [ ] All credentials stored as environment variables
- [ ] No hardcoded secrets in code
- [ ] `.env` files in `.gitignore`
- [ ] Production uses different credentials than development
- [ ] Regular credential rotation schedule
- [ ] Security monitoring enabled
- [ ] Access logs reviewed regularly

## 🔧 Secure Configuration Examples

### Environment Variables (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DATABASE=your-database-name

# Authentication
JWT_SECRET=your-very-long-and-secure-secret-key
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Render Deployment (render.yaml)
```yaml
envVars:
  - key: MONGODB_URI
    sync: false  # Set in Render dashboard
  - key: JWT_SECRET
    sync: false  # Set in Render dashboard
```

### Vercel Deployment
Set environment variables in Vercel dashboard, never in code.

## 📞 Contact

For security-related questions or concerns, please contact:
- Email: [your-security-email@domain.com]
- Security Team: [security-team@domain.com]

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!