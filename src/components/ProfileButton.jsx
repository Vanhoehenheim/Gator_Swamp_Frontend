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
    <div className="fixed top-0 left-0 right-0 bg-stone-100 p-4 z-10 flex justify-between shadow-sm">
      <div className="flex items-center gap-4">
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
      <div className="text-xl font-doto font-bold">
        gator swamp
      </div>
    </div>
  );
};

export default ProfileButton;