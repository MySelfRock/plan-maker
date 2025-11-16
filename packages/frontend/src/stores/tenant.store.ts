import { create } from 'zustand';

interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  customCss?: string;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
  customDomain?: string;
}

interface TenantState {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;

  setTenant: (tenant: Tenant) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  applyTheme: (theme: TenantTheme) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  isLoading: true,
  error: null,

  setTenant: (tenant) => {
    set({ tenant, isLoading: false });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  applyTheme: (theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Apply primary color
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-primary-light', lightenColor(theme.primaryColor, 20));
    root.style.setProperty('--color-primary-dark', darkenColor(theme.primaryColor, 20));

    // Apply secondary color
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-secondary-light', lightenColor(theme.secondaryColor, 20));
    root.style.setProperty('--color-secondary-dark', darkenColor(theme.secondaryColor, 20));

    // Apply accent color
    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--color-accent-light', lightenColor(theme.accentColor, 20));
    root.style.setProperty('--color-accent-dark', darkenColor(theme.accentColor, 20));

    // Apply font family
    if (theme.fontFamily) {
      root.style.setProperty('--font-family', theme.fontFamily);
    }

    // Apply custom CSS
    if (theme.customCss) {
      const styleId = 'tenant-custom-css';
      let styleEl = document.getElementById(styleId);

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = theme.customCss;
    }

    // Update favicon
    if (theme.faviconUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = theme.faviconUrl;
      }
    }
  },
}));

// Helper functions to lighten/darken colors
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
