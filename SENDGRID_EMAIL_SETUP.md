# 📧 SendGrid Email Setup Guide

## 🚀 SendGrid Integration Complete!

I've successfully implemented SendGrid email functionality for your team invitations. Here's what's been added:

### ✅ **What's Implemented:**

1. **SendGrid Dependency** - Added to `pom.xml`
2. **SendGrid Configuration** - Added to `application.yml`
3. **SendGrid Config Class** - Handles API key configuration
4. **Enhanced EmailService** - Now sends actual emails via SendGrid
5. **Beautiful Email Templates** - HTML and plain text versions
6. **Team Invitation Emails** - Professional templates with role descriptions
7. **Email Testing Endpoints** - For testing the integration

### 🔧 **Setup Instructions:**

#### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

#### Step 2: Create API Key
1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access**
5. Give it a name like "Pebly Production"
6. Under **Mail Send**, select **Full Access**
7. Click **Create & View**
8. **Copy the API key** (you won't see it again!)

#### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification**
3. Add your email (e.g., `noreply@yourdomain.com`)
4. Verify the email address

#### Step 4: Configure Environment Variables

Add these environment variables to your deployment:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Pebly Team
```

#### Step 5: Update Frontend URL (if needed)
Make sure the invite URL in the email points to your correct frontend:
```bash
FRONTEND_URL=https://pebly.vercel.app
```

### 🧪 **Testing the Integration:**

#### Method 1: Test Email Endpoint
```bash
curl -X POST https://your-backend-url/api/v1/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

#### Method 2: Test HTML Email Endpoint
```bash
curl -X POST https://your-backend-url/api/v1/email/test-html \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

#### Method 3: Test Team Invitation
1. Go to your team management page
2. Invite a member using a real email address
3. Check if the email is received

### 📧 **Email Templates:**

#### Team Invitation Email Features:
- **Professional HTML Design** with Pebly branding
- **Plain Text Fallback** for email clients that don't support HTML
- **Role Descriptions** explaining what each role can do
- **Expiration Notice** (7 days)
- **Direct Accept Link** to join the team
- **Help Center Link** for support

#### Email Content Includes:
- Inviter's name and team name
- Role assignment and permissions
- Branded design with gradients
- Mobile-responsive layout
- Clear call-to-action button

### 🔍 **Troubleshooting:**

#### If Emails Aren't Being Sent:
1. **Check Logs** - Look for SendGrid API errors in server logs
2. **Verify API Key** - Make sure it's correctly set in environment variables
3. **Check Sender Email** - Must be verified in SendGrid
4. **Test Endpoint** - Use the test endpoints to verify configuration

#### Common Issues:
- **403 Forbidden**: API key is invalid or doesn't have mail send permissions
- **400 Bad Request**: Sender email not verified or malformed request
- **Emails in Spam**: Add SPF/DKIM records (SendGrid provides these)

### 📊 **SendGrid Dashboard:**

After setup, you can monitor:
- **Email Delivery Stats** - Opens, clicks, bounces
- **Suppression Lists** - Blocked/unsubscribed emails
- **Activity Feed** - Real-time email events
- **Analytics** - Detailed email performance

### 🎯 **Production Recommendations:**

1. **Domain Authentication** - Set up domain authentication for better deliverability
2. **Dedicated IP** - Consider for high volume (paid plans)
3. **Email Templates** - Use SendGrid's template engine for easier management
4. **Webhooks** - Set up webhooks to track email events
5. **Monitoring** - Set up alerts for delivery failures

### 🔒 **Security Best Practices:**

1. **API Key Permissions** - Only grant necessary permissions
2. **Environment Variables** - Never commit API keys to code
3. **Key Rotation** - Rotate API keys periodically
4. **Rate Limiting** - Monitor for unusual sending patterns

### 💰 **SendGrid Pricing:**

- **Free Tier**: 100 emails/day forever
- **Essentials**: $14.95/month for 50,000 emails
- **Pro**: $89.95/month for 1.5M emails
- **Premier**: Custom pricing for enterprise

### 🚀 **Next Steps:**

1. **Set up SendGrid account** and get API key
2. **Configure environment variables** in your deployment
3. **Test the integration** using the test endpoints
4. **Try sending a team invitation** to verify everything works
5. **Monitor email delivery** in SendGrid dashboard

The team invitation emails will now be sent automatically when you invite members! 🎉

### 📝 **Email Preview:**

The invitation emails include:
- Beautiful HTML design with Pebly branding
- Clear team and role information
- One-click accept button
- Role permission descriptions
- 7-day expiration notice
- Help and support links

**Your team members will now receive professional invitation emails when you invite them!** 📧✨