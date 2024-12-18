import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GatorLogo from "../../assets/gator.svg";
import GatorLogo1 from "../../assets/gator2.svg";
import GatorLogo2 from "../../assets/gator3.svg";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password);
    if (result.success) {
      navigate("/feed");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="bg-stone-100 flex items-center justify-center w-full">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col justify-center align-middle">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1" />
          <h1 className="text-6xl font-doto font-bold text-black text-center flex-2">
            gator swamp
          </h1>
          <div className="flex-1 flex justify-end">
            <img src={GatorLogo2} alt="Gator Swamp Logo" className="size-40" />
          </div>
        </div>
        <div className="px-20 text-center">
        <h2 className="text-2xl font-mono text-black mb-4 text-center">
          log in
        </h2>

        {error && (
          <div className="mb-8 p-4 bg-white border marin border-black text-black text-center">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block font-medium text-black mb-2">
            email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-3/4 p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-8">
          <label className="block font-medium text-black mb-2">
            password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-3/4 p-2 bg-white border-2 rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-1/3 bg-black text-white font-semi text-xl py-2 hover:bg-gray-900 focus:outline-none border-2 border-black transition-colors"
        >
          enter!
        </button>
        </div>


        <div className="mt-8 text-center border-t-2 border-black pt-4">
          <span className="text-black">not yet subscribed? </span>
          <a
            href="/register"
            className="font-bold text-black underline hover:text-gray-800"
          >
            register for access
          </a>
        </div>
      </form>
    </div>
  );
};
