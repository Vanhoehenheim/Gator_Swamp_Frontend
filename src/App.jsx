import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm'
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <div className="bg-stone-100 mx-0">
        {/* Add your header/navigation here */}
        <main className="container mx-auto">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;