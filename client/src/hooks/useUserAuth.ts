import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { fetchCsrfToken } from "@/lib/csrf";
import { useToast } from "@/hooks/use-toast";
import { getHttpStatusMessage } from "@/lib/language";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useLanguage } from "@shared/LanguageProvider";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
}

interface AuthResponse {
  user: User;
}

export function useUserAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  const parseError = (error: Error): string => {
    const match = error.message.match(/^(\d{3}):\s*(.*)$/);
    const status = match ? parseInt(match[1], 10) : undefined;
    const serverMsg = match ? match[2] : error.message;
    return (status && getHttpStatusMessage(status, language)) || serverMsg;
  };

  // Get current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (user) {
      fetchCsrfToken();
    }
  }, [user]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await fetchCsrfToken();
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: parseError(error),
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return await res.json() as AuthResponse;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await fetchCsrfToken();
      toast({
        title: "Registration Successful",
        description: `Welcome to DevInterview, ${data.user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: parseError(error),
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Navigate to home page after logout
      navigate("/");
    },
    onError: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}