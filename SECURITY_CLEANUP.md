# 🚨 URGENT: Security Cleanup Required

## Exposed Credentials Found in Git History

Your MongoDB credentials were exposed in commit `569f8fc` in the file `scripts/mongodb-direct-setup.js`.

**Exposed:**
- Username: `lahorivenkatesh709`
- Password: `p0SkcBwHo67ghvMW`
- Cluster: `cluster0.y8ucl.mongodb.net`

---

## ⚠️ IMMEDIATE ACTION REQUIRED

### Step 1: Change MongoDB Password (DO THIS FIRST!)

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click on "Database Access" in the left sidebar
3. Find user `lahorivenkatesh709`
4. Click "Edit" → "Edit Password"
5. Generate a new strong password
6. Click "Update User"

**This makes the exposed password useless immediately!**

---

### Step 2: Remove Credentials from Git History

Since the credentials are already pushed to GitHub, they exist in git history. You have two options:

#### Option A: Use BFG Repo-Cleaner (Recommended - Faster)

```bash
# 1. Install BFG (if not installed)
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create a file with the password to remove
echo "p0SkcBwHo67ghvMW" > passwords.txt

# 3. Run BFG to remove the password from all history
bfg --replace-text passwords.txt

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (WARNING: This rewrites history!)
git push origin main --force

# 6. Delete the passwords file
rm passwords.txt
```

#### Option B: Manual Git Filter (Alternative)

```bash
# Remove the specific commit from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/mongodb-direct-setup.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin main --force
```

---

### Step 3: Update Environment Variables

Make sure your `.env` files are properly configured and NOT committed:

```bash
# Check .gitignore includes .env files
cat .gitignore | grep ".env"

# If not, add them:
echo ".env" >> .gitignore
echo "**/.env" >> .gitignore
git add .gitignore
git commit -m "Ensure .env files are ignored"
git push origin main
```

---

### Step 4: Verify Cleanup

```bash
# Search for any remaining credentials in history
git log -S "p0SkcBwHo67ghvMW" --all

# Should return nothing if cleaned successfully
```

---

## 📋 Checklist

- [ ] Changed MongoDB password in Atlas
- [ ] Removed credentials from git history using BFG or filter-branch
- [ ] Force pushed to GitHub
- [ ] Verified credentials are gone: `git log -S "p0SkcBwHo67ghvMW" --all`
- [ ] Updated local `.env` with new password
- [ ] Verified `.env` files are in `.gitignore`
- [ ] Tested application with new credentials

---

## 🔒 Prevention for Future

1. **Never hardcode credentials** - Always use environment variables
2. **Use `.env` files** - Keep them in `.gitignore`
3. **Use git hooks** - Install pre-commit hooks to scan for secrets
4. **Use secret scanning tools** - GitHub has built-in secret scanning

### Install git-secrets (Recommended)

```bash
# Install
brew install git-secrets  # macOS

# Setup for this repo
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'mongodb\+srv://[^:]+:[^@]+@'
git secrets --add 'password.*=.*[A-Za-z0-9]{10,}'
```

---

## ⚠️ Important Notes

- **Force pushing rewrites history** - Coordinate with team members if any
- **After force push**, other developers need to: `git fetch origin && git reset --hard origin/main`
- **GitHub may cache** - The credentials might still be visible in GitHub's cache for a short time
- **Rotate immediately** - Even after cleanup, assume credentials are compromised

---

## Need Help?

If you're unsure about any step, it's better to:
1. Change the password immediately (Step 1)
2. Create a new MongoDB cluster with new credentials
3. Update your application to use the new cluster

This is safer than trying to clean git history if you're not comfortable with it.
