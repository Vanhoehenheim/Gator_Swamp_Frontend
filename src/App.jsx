import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm'
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Analytics } from '@vercel/analytics/react';


// Component to handle app layout
const AppLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-stone-100 dark:bg-dark-slate-900 dark:text-gray-200 mx-0 min-h-screen transition-colors duration-200">
          <Analytics />
          <AppLayout />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;