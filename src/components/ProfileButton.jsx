import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ProfileButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const isOnProfile = location.pathname === '/profile';
  
  const handleClick = () => {
    if (isOnProfile) {
      navigate('/feed');
    } else {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-stone-100 dark:bg-dark-slate-800 p-4 z-10 flex justify-between shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={handleClick}
          className="text-lg font-bold text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4 decoration-2 transition-colors"
        >
          {isOnProfile ? 'feed' : 'profile'}
        </button>
        <button
          onClick={handleLogout}
          className="text-lg font-bold text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2 transition-colors"
        >
          logout
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-slate-700 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700" />
          )}
        </button>
        <div className="text-xl font-doto font-bold dark:text-white">
          gator swamp
        </div>
      </div>
    </div>
  );
};

export default ProfileButton;