import { useNavigate, useLocation } from 'react-router-dom';

const ProfileButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOnProfile = location.pathname === '/profile';
  
  const handleClick = () => {
    if (isOnProfile) {
      navigate('/feed');
    } else {
      navigate('/profile');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 left-4 text-lg font-bold text-black hover:text-gray-700 underline underline-offset-4 decoration-2"
    >
      {isOnProfile ? 'feed' : 'profile'}
    </button>
  );
};

export default ProfileButton;