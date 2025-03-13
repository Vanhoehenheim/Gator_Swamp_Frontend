import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm'
import { Outlet, useNavigate } from 'react-router-dom';
import ProfileButton from './components/ProfileButton';

// Component to conditionally render the ProfileButton
const NavigationWrapper = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Don't show ProfileButton on login or register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <>
      {currentUser && !isAuthPage && <ProfileButton />}
      <Outlet />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="bg-stone-100 mx-0 min-h-screen">
        <NavigationWrapper />
      </div>
    </AuthProvider>
  );
}
export default App;