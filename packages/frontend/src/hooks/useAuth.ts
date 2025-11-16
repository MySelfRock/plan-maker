import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, setUser, logout: logoutStore } = useAuthStore();

  // Get current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await apiClient.auth.getMe();
      return response.data;
    },
    enabled: isAuthenticated,
    retry: false,
    onSuccess: (data) => {
      setUser(data);
    },
    onError: () => {
      logoutStore();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const response = await apiClient.auth.register(data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/onboarding');
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.auth.login(data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/dashboard');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.auth.logout();
    },
    onSettled: () => {
      logoutStore();
      router.push('/login');
    },
  });

  return {
    user: userData || user,
    isAuthenticated,
    isLoading,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  };
}
