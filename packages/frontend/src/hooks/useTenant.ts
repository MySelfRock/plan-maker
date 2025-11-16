import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenantStore } from '@/stores/tenant.store';
import { apiClient } from '@/lib/api';

export function useTenant() {
  const { tenant, setTenant, setLoading, setError, applyTheme } = useTenantStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const response = await apiClient.tenants.getCurrent();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  useEffect(() => {
    if (data) {
      setTenant(data);
      applyTheme(data.theme);
    }
  }, [data, setTenant, applyTheme]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (error) {
      setError((error as Error).message);
    }
  }, [error, setError]);

  return { tenant, isLoading, error };
}
