import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Custom hook for handling user login
export function useLoginMutation (options = {}) {
  const auth = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials) => auth.login(credentials.email, credentials.password),
    onSuccess: (result, variables, context) => {
      console.log("Login mutation successful:", result);
      if (result && result.success) {
        console.log("Login successful, navigating to profile page");
        navigate("/profile", { replace: true });
      } else {
        // Throw an error that useMutation's onError can catch
        // This ensures consistent error handling via the hook's return values
        throw new Error(result?.error || "Login failed: Invalid credentials or server issue.");
      }
      // Call user-provided onSuccess if it exists
      options.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
        console.error("Login mutation error:", error);
        // Error is already logged, just call user-provided onError
         options.onError?.(error, variables, context);
    },
    // Allow overriding other mutation options
    ...options,
  });
}

// Custom hook for handling user registration
export function useRegisterMutation (options = {}) {
  const auth = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData) => auth.register(userData.username, userData.email, userData.password),
    onSuccess: (result, variables, context) => {
        console.log("Registration mutation successful:", result);
        if (result && result.success) {
            console.log("Registration successful, navigating to login page");
            navigate("/login", { replace: true });
        } else {
           // Throw error for consistency
            throw new Error(result?.error || "Registration failed. Please check your details.");
        }
        options.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
        console.error("Registration mutation error:", error);
        options.onError?.(error, variables, context);
    },
    ...options,
  });
} 