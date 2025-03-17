import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Menu, X, User, Home, MessageSquare, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Extract current path for highlighting active nav item
  const currentPath = location.pathname;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // Only show navbar for authenticated users and not on auth pages
  const isAuthPage = currentPath === '/login' || currentPath === '/register';
  
  if (!currentUser || isAuthPage) return null;
  
  return (
    <nav className="fixed top-0 left-0 right-0 w-full text-gray-900 dark:text-white bg-slate-100 dark:bg-dark-slate-800 p-3 z-10 shadow-lg">
      {/* Desktop view */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-3 items-center">
        {/* Logo - Left column (spans full width on small screens) */}
        <div className="flex items-center col-span-2 md:col-span-1">
          <Link
            to="/feed"
            className="font-doto font-bold hover:opacity-80 transition-opacity text-base sm:text-xl"
          >
            gator swamp
          </Link>
        </div>

        {/* Desktop Navigation - Center column (hidden on mobile) */}
        <div className="hidden md:flex items-center justify-center space-x-8">
          <Link
            to="/feed"
            className={`text-sm font-bold ${
              currentPath === "/feed"
                ? "dark:text-white underline underline-offset-4 decoration-2"
                : "text-gray-500 dark:text-white hover:dark:text-white"
            } 
            `}
          >
            feed
          </Link>
          <Link
            to="/profile"
            className={`text-sm font-bold ${
              currentPath === "/profile"
                ? "dark:text-white underline underline-offset-4 decoration-2"
                : "text-gray-500 dark:text-white hover:dark:text-white"
            } 
            `}
          >
            profile
          </Link>
          <Link
            to="/messages"
            className={`text-sm font-bold ${
              currentPath === "/messages"
                ? "dark:text-white underline underline-offset-4 decoration-2"
                : "text-gray-500 dark:text-white hover:dark:text-white"
            } 
            `}
          >
            messages
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-red-500 hover:text-red-400"
          >
            logout
          </button>
        </div>

        {/* Theme Toggle and Mobile Menu Button - Right column */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full dark:hover:bg-dark-slate-700 hover:bg-slate-300 hover:text-white"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-stone-700" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full dark:hover:bg-dark-slate-700 hover:bg-slate-300 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 dark:text-white" />
            ) : (
              <Menu className="h-5 w-5 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 w-full bg-slate-100 dark:bg-dark-slate-800 shadow-md py-3 px-4 border-t border-dark-slate-700">
          <div className="max-w-7xl mx-auto flex flex-col space-y-3">
            <Link
              to="/feed"
              className="flex items-center space-x-2 dark:text-white hover:text-gray-200 text-sm font-semibold  py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={16} />
              <span>feed</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center space-x-2 dark:text-white hover:text-gray-200 text-sm font-semibold py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={16} />
              <span>profile</span>
            </Link>
            <Link
              to="/messages"
              className="flex items-center space-x-2 dark:text-white hover:text-gray-200 text-sm  font-semibold py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare size={16} />
              <span>messages</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-500 hover:text-red-400 py-1  text-sm font-semibold text-left"
            >
              <LogOut size={16} />
              <span>logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;