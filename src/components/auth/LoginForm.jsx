import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
      
    const result = await login(email, password);
    if (result.success) {
      navigate('/feed');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center font-doto">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl p-12">
        <h1 className="text-6xl font-bold text-black mb-2 text-center">
          Gator Swamp
        </h1>
        <h2 className="text-4xl font-bold text-black mb-8 text-center mt-8">
          Log In
        </h2>
        
        {error && (
          <div className="mb-8 p-4 bg-white border border-black text-black text-center font-semibold">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-black font-bold text-xl mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-white border-2 border-black text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-8">
          <label className="block text-black font-bold text-xl mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-white border-2 border-black text-black text-lg focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-bold text-xl py-3 hover:bg-gray-900 focus:outline-none border-2 border-black transition-colors"
        >
          ENTER
        </button>

        <div className="mt-8 text-center border-t-2 border-black pt-4">
          <span className="text-black text-lg">Not yet subscribed? </span>
          <a href="/register" className="font-bold text-black underline hover:text-gray-800">
            Register for Access
          </a>
        </div>
      </form>
    </div>
  );
};