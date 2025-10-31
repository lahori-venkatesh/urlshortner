// Invite validation utilities

export interface InviteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateInviteRequest = (
  teamId: string,
  email: string,
  role: string,
  userId?: string
): InviteValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!teamId || teamId.trim() === '') {
    errors.push('Team ID is required');
  }

  if (!email || email.trim() === '') {
    errors.push('Email address is required');
  }

  if (!role || role.trim() === '') {
    errors.push('Role is required');
  }

  if (!userId || userId.trim() === '') {
    errors.push('User ID is required (authentication issue)');
  }

  // Validate email format
  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Validate role
  if (role && role.trim() !== '') {
    const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role.toUpperCase())) {
      errors.push('Invalid role. Must be one of: OWNER, ADMIN, MEMBER, VIEWER');
    }
  }

  // Check for common issues
  if (email && email.includes(' ')) {
    warnings.push('Email contains spaces - they will be trimmed');
  }

  if (teamId && teamId.includes(' ')) {
    warnings.push('Team ID contains spaces - they will be trimmed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const debugInviteContext = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔍 Invite Context Debug:', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'None',
    hasUser: !!user,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString()
  });

  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('👤 User Data:', {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        isAuthenticated: userData.isAuthenticated
      });
    } catch (e) {
      console.error('❌ Failed to parse user data:', e);
    }
  }

  return { hasToken: !!token, hasUser: !!user };
};