import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check localStorage for admin auth first
  const localAuth = localStorage.getItem('adminAuth');
  let localUser = null;
  
  if (localAuth) {
    try {
      const authData = JSON.parse(localAuth);
      // Check if auth is still valid (24 hours)
      if (authData.timestamp && (Date.now() - authData.timestamp) < 24 * 60 * 60 * 1000) {
        localUser = authData.user;
      } else {
        localStorage.removeItem('adminAuth');
      }
    } catch (error) {
      localStorage.removeItem('adminAuth');
    }
  }

  // Only query server if no local user
  const { data: regularUser, isLoading: regularLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !localUser,
  });

  const user = localUser || regularUser;
  const isLoading = !localUser && regularLoading;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
