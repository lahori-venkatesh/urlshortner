# BitaURL - Frontend Documentation

## 🎯 Overview

The BitaURL frontend is a modern React application built with TypeScript, providing a responsive and intuitive user interface for URL management, analytics, and team collaboration. The application follows modern React patterns and best practices for maintainability and scalability.

## 🏗️ Architecture

### Technology Stack
- **React 18** - Latest React with concurrent features
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality React components
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hook Form** - Form handling and validation
- **Framer Motion** - Animation library
- **React Hot Toast** - Toast notifications

### Project Structure
```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Shadcn)
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components
│   │   ├── charts/         # Chart components
│   │   └── support/        # Support widget components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── urls/           # URL management pages
│   │   ├── qr/             # QR code pages
│   │   ├── files/          # File management pages
│   │   ├── teams/          # Team collaboration pages
│   │   ├── domains/        # Custom domain pages
│   │   ├── analytics/      # Analytics pages
│   │   └── settings/       # Settings pages
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React Context providers
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Application constants
│   └── styles/             # Global styles
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🧩 Component Architecture

### Component Hierarchy
```
App
├── Router
├── AuthProvider
├── ThemeProvider
├── ModalProvider
└── Layout
    ├── Header
    ├── Sidebar
    ├── Main Content
    └── Footer
```

### Core Components

#### 1. Layout Components
```typescript
// Header Component
interface HeaderProps {
  user?: User;
  onMenuToggle: () => void;
  notifications: Notification[];
}

// Sidebar Component
interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
  userRole: UserRole;
}

// Main Layout
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  header?: boolean;
}
```

#### 2. Form Components
```typescript
// URL Shortener Form
interface UrlShortenerProps {
  onSubmit: (data: UrlData) => Promise<void>;
  initialData?: Partial<UrlData>;
  mode: 'create' | 'edit';
}

// Team Invitation Form
interface TeamInviteProps {
  teamId: string;
  onInvite: (email: string, role: TeamRole) => Promise<void>;
}
```

#### 3. Data Display Components
```typescript
// Analytics Chart
interface AnalyticsChartProps {
  data: AnalyticsData[];
  type: 'line' | 'bar' | 'pie';
  timeRange: TimeRange;
}

// URL List
interface UrlListProps {
  urls: Url[];
  onEdit: (url: Url) => void;
  onDelete: (urlId: string) => void;
  onAnalytics: (urlId: string) => void;
}
```

## 🎣 Custom Hooks

### Authentication Hooks
```typescript
// useAuth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// usePermissions Hook
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (resource: string, action: string): boolean => {
    return user?.permissions?.includes(`${resource}:${action}`) || false;
  };
  
  const canAccess = (feature: Feature): boolean => {
    return user?.plan && planFeatures[user.plan].includes(feature);
  };
  
  return { hasPermission, canAccess };
};
```

### Data Fetching Hooks
```typescript
// useUrls Hook
export const useUrls = (filters?: UrlFilters) => {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getUrls(filters);
      setUrls(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);
  
  return { urls, loading, error, refetch: fetchUrls };
};

// useAnalytics Hook
export const useAnalytics = (urlId: string, timeRange: TimeRange) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.getAnalytics(urlId, timeRange);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [urlId, timeRange]);
  
  return { analytics, loading };
};
```

## 🌐 State Management

### Context Providers

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Implementation details...
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### ModalContext
```typescript
interface ModalContextType {
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
}

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<Record<string, boolean>>({});
  
  // Implementation details...
  
  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};
```

#### ThemeContext
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 🔌 API Integration

### API Service Layer
```typescript
// api.ts - Central API client
class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }
  
  // URL Management APIs
  async createUrl(data: CreateUrlRequest): Promise<Url> {
    const response = await this.client.post('/api/v1/urls', data);
    return response.data;
  }
  
  async getUrls(filters?: UrlFilters): Promise<Url[]> {
    const response = await this.client.get('/api/v1/urls', { params: filters });
    return response.data;
  }
  
  async updateUrl(id: string, data: UpdateUrlRequest): Promise<Url> {
    const response = await this.client.put(`/api/v1/urls/${id}`, data);
    return response.data;
  }
  
  async deleteUrl(id: string): Promise<void> {
    await this.client.delete(`/api/v1/urls/${id}`);
  }
  
  // Analytics APIs
  async getAnalytics(urlId: string, timeRange: TimeRange): Promise<AnalyticsData> {
    const response = await this.client.get(`/api/v1/analytics/${urlId}`, {
      params: { timeRange }
    });
    return response.data;
  }
  
  // Team Management APIs
  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await this.client.post('/api/v1/teams', data);
    return response.data;
  }
  
  async inviteTeamMember(teamId: string, email: string, role: TeamRole): Promise<void> {
    await this.client.post(`/api/v1/teams/${teamId}/invite`, { email, role });
  }
}

export const api = new ApiClient();
```

### Error Handling
```typescript
// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 401) {
    return 'Authentication required. Please log in again.';
  }
  
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.response?.status === 429) {
    return 'Rate limit exceeded. Please try again later.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// API error boundary
export class ApiErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 🎨 Styling & Design System

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ]
};
```

### Component Styling Patterns
```typescript
// Button component with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};
```

## 📱 Responsive Design

### Breakpoint Strategy
```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large desktop */
```

### Mobile-First Approach
```typescript
// Responsive component example
export const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div className="col-span-1 lg:col-span-2">
        <AnalyticsChart />
      </div>
      <div className="col-span-1">
        <RecentActivity />
      </div>
    </div>
  );
};
```

## 🔒 Security Implementation

### Input Validation
```typescript
// Form validation with Zod
import { z } from 'zod';

const urlSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL'),
  customAlias: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  expiresAt: z.date().optional(),
});

type UrlFormData = z.infer<typeof urlSchema>;

export const UrlForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema)
  });
  
  const onSubmit = (data: UrlFormData) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields with validation */}
    </form>
  );
};
```

### XSS Protection
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};

// Safe HTML rendering
export const SafeHtml: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = sanitizeHtml(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// Button component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button variant="primary" size="md">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Button variant="primary" size="md" onClick={handleClick}>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(
      <Button variant="primary" size="md" disabled>
        Click me
      </Button>
    );
    
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Integration Testing
```typescript
// URL creation flow test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UrlShortener } from './UrlShortener';
import { api } from '../services/api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('URL Shortener Integration', () => {
  it('creates a short URL successfully', async () => {
    const mockUrl = {
      id: '1',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      shortUrl: 'https://bit.ly/abc123'
    };
    
    mockedApi.createUrl.mockResolvedValue(mockUrl);
    
    render(<UrlShortener />);
    
    fireEvent.change(screen.getByLabelText('Original URL'), {
      target: { value: 'https://example.com' }
    });
    
    fireEvent.click(screen.getByText('Shorten URL'));
    
    await waitFor(() => {
      expect(screen.getByText('https://bit.ly/abc123')).toBeInTheDocument();
    });
    
    expect(mockedApi.createUrl).toHaveBeenCalledWith({
      originalUrl: 'https://example.com'
    });
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
```typescript
// Lazy loading for route components
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### Memoization
```typescript
// Memoized components for performance
import { memo, useMemo, useCallback } from 'react';

export const UrlList = memo<UrlListProps>(({ urls, onEdit, onDelete }) => {
  const sortedUrls = useMemo(() => {
    return urls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [urls]);
  
  const handleEdit = useCallback((url: Url) => {
    onEdit(url);
  }, [onEdit]);
  
  return (
    <div>
      {sortedUrls.map(url => (
        <UrlItem key={url.id} url={url} onEdit={handleEdit} onDelete={onDelete} />
      ))}
    </div>
  );
});
```

## 📦 Build & Deployment

### Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### Environment Configuration
```bash
# .env.local
REACT_APP_API_URL=https://api.bitaurl.com
REACT_APP_RAZORPAY_KEY=rzp_live_xxxxx
REACT_APP_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
REACT_APP_ENVIRONMENT=production
```

---

This frontend documentation provides comprehensive guidance for developing, maintaining, and extending the BitaURL React application. For specific implementation details, refer to the component source code and inline documentation.