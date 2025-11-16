# @planmaker/frontend - Next.js White-label Frontend

Modern, responsive frontend for the PlanMaker SaaS platform with dynamic white-label theming.

## 🎯 Features

- **Next.js 14** with App Router
- **White-label Theming** - Dynamic CSS variables based on tenant
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Type-safe** - Full TypeScript coverage
- **State Management** - Zustand for global state
- **API Integration** - React Query for data fetching
- **Form Validation** - React Hook Form + Zod
- **Animations** - Smooth transitions with Framer Motion

## 🏗️ Architecture

```
src/
├── app/               # Next.js 14 App Router
│   ├── login/         # Authentication pages
│   ├── register/
│   ├── onboarding/    # User onboarding flow
│   ├── dashboard/     # Main dashboard
│   └── plans/         # Plan management
├── components/
│   ├── ui/            # Reusable UI components
│   ├── layouts/       # Layout components
│   └── features/      # Feature-specific components
├── hooks/             # Custom React hooks
├── stores/            # Zustand state stores
├── lib/               # Utilities and helpers
└── styles/            # Global styles
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Yarn
- Backend API running on http://localhost:3000

### Installation

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env

# Edit .env with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Start development server
yarn dev
```

Visit http://localhost:3001

## 🎨 White-label Theming

The frontend automatically fetches tenant configuration from the API and applies custom theming.

### How it Works

1. **Tenant Detection**: Resolves tenant from hostname (subdomain or custom domain)
2. **Theme Application**: Sets CSS variables dynamically
3. **Logo & Branding**: Updates logo, favicon, and colors

### Theme Structure

```typescript
interface TenantTheme {
  primaryColor: string;      // Main brand color
  secondaryColor: string;    // Secondary color
  accentColor: string;       // Accent/highlight color
  logoUrl?: string;          // Custom logo
  faviconUrl?: string;       // Custom favicon
  fontFamily?: string;       // Custom font
  customCss?: string;        // Additional CSS
}
```

### CSS Variables

```css
:root {
  --color-primary: #3B82F6;
  --color-primary-light: #60A5FA;
  --color-primary-dark: #2563EB;

  --color-secondary: #10B981;
  --color-accent: #F59E0B;

  --font-family: -apple-system, ...;
}
```

Use in components:

```tsx
<div className="bg-primary text-white">
  Themed button
</div>
```

## 📦 State Management

### Auth Store

```typescript
import { useAuthStore } from '@/stores/auth.store';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore();

  // ...
}
```

### Tenant Store

```typescript
import { useTenantStore } from '@/stores/tenant.store';

function MyComponent() {
  const { tenant, applyTheme } = useTenantStore();

  // Theme is auto-applied on mount
}
```

## 🔌 API Integration

### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.plans.getAll();
      return response.data;
    },
  });
}
```

### Available API Clients

- `apiClient.auth` - Authentication
- `apiClient.profile` - User profiles
- `apiClient.plans` - Plan management
- `apiClient.templates` - Templates
- `apiClient.exercises` - Exercises
- `apiClient.subscriptions` - Payments

## 🧩 Components

### UI Components

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

// Usage
<Button variant="primary" size="lg">
  Click me
</Button>

<Input
  label="Email"
  type="email"
  error="Invalid email"
/>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Layouts

```tsx
import { MainLayout } from '@/components/layouts/MainLayout';

export default function MyPage() {
  return (
    <MainLayout>
      <h1>My Page</h1>
    </MainLayout>
  );
}
```

## 📄 Pages

### Authentication

- `/login` - User login
- `/register` - New account creation

### Onboarding

- `/onboarding` - Multi-step profile setup
  - Step 1: Choose niche and level
  - Step 2: Set goals and equipment
  - Step 3: Define availability

### Dashboard

- `/dashboard` - Main dashboard
  - Stats overview
  - Active plans
  - Quick actions

### Plans

- `/plans` - Plan list
- `/plans/[id]` - Plan details
  - Weekly schedule
  - Session tracking
  - Complete sessions with feedback

## 🎨 Styling

### Tailwind CSS

```tsx
// Use utility classes
<div className="bg-white rounded-lg shadow-md p-6">
  Content
</div>

// Or custom utility classes
<div className="card">
  Content
</div>
```

### Custom Classes

Defined in `globals.css`:

- `.card` - Card style
- `.btn` - Button base
- `.btn-primary` - Primary button
- `.input` - Input field
- `.label` - Form label

## 🔐 Authentication Flow

```
1. User visits app
2. If not authenticated → /login
3. Login → Set auth tokens → /dashboard
4. If no profile → /onboarding
5. Complete onboarding → /dashboard
```

### Protected Routes

Wrap pages with auth check:

```tsx
'use client';

export default function ProtectedPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated]);

  // ...
}
```

## 📱 Responsive Design

```tsx
// Mobile-first approach
<div className="
  p-4          // Mobile
  md:p-6       // Tablet
  lg:p-8       // Desktop
">
  Content
</div>
```

## 🧪 Development

```bash
# Development server
yarn dev

# Type check
yarn type-check

# Lint
yarn lint

# Build for production
yarn build

# Start production server
yarn start
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3001
CMD ["yarn", "start"]
```

## 🎯 Features Implemented

### ✅ Authentication
- Login / Register
- JWT token management
- Auto token refresh
- Protected routes

### ✅ White-label
- Dynamic theming
- Tenant resolution
- Custom branding
- CSS variable injection

### ✅ Onboarding
- Multi-step flow
- Form validation
- Profile creation
- Goal selection

### ✅ Dashboard
- Stats overview
- Plan management
- Quick actions
- Responsive design

### ✅ Plans
- Plan listing
- Detailed view
- Session tracking
- Progress feedback

## 🔮 Future Enhancements

- [ ] Real-time updates (WebSockets)
- [ ] PDF export from frontend
- [ ] Calendar integration
- [ ] Social sharing
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)
- [ ] Advanced analytics
- [ ] In-app notifications

## 📝 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_NAME=PlanMaker
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

## 🐛 Troubleshooting

### API Connection Issues

```bash
# Check API is running
curl http://localhost:3000/api/v1/tenants/current

# Check CORS settings in backend
```

### Theme Not Applying

1. Check tenant API response
2. Verify theme object structure
3. Check browser console for errors
4. Clear browser cache

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
yarn install

# Rebuild
yarn build
```

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
