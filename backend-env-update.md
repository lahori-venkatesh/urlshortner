# Backend Environment Variable Update

## Add to your backend environment variables:

```bash
PROXY_DOMAIN=pebly.lahorivenkatesh709.workers.dev
```

## For Render.com deployment:

1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment tab
4. Add new environment variable:
   - **Key**: `PROXY_DOMAIN`
   - **Value**: `pebly.lahorivenkatesh709.workers.dev`
5. Save and redeploy

## This ensures:
- New domains will use the correct CNAME target
- The system is configurable for different proxy domains
- Consistent configuration between frontend and backend