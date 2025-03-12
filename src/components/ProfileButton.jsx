import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
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
    <div className="absolute top-4 left-4 flex items-center gap-4">
      <button
        onClick={handleClick}
        className="text-lg font-bold text-black hover:text-gray-700 underline underline-offset-4 decoration-2"
      >
        {isOnProfile ? 'feed' : 'profile'}
      </button>
      <button
        onClick={handleLogout}
        className="text-lg font-bold text-red-600 hover:text-red-700 underline underline-offset-4 decoration-2"
      >
        logout
      </button>
    </div>
  );
};

export default ProfileButton;