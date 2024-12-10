import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import Home from '../components/Home';
import Profile from '../components/Profile';
import Messages from '../components/Messages';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Navigate to="/login" replace /> // Redirect root to login
      },
      {
        path: "/login",
        element: <LoginForm />
      },
      {
        path: "/register",
        element: <RegisterForm />
      },
      {
        path: "/feed",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: "/messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        )
      }
    ]
  }
]);