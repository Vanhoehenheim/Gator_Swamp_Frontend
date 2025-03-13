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

    try {
      const result = await login(email, password);
      console.log("Login result:", result);
      
      // Check for success in multiple ways since API response may vary
      if (result && (result.success || result.token || result.userId)) {
        console.log("Login successful, navigating to profile page");
        // Navigate to profile page after successful login
        navigate("/profile", { replace: true });
      } else {
        setError(result?.error || "Login failed");
      }
    } catch (err) {
      console.error("Login form error:", err);
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="bg-stone-100 flex items-center justify-center w-full min-h-screen p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col justify-center align-middle">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-4">
          <div className="flex-1 hidden md:block" />
          <h1 className="text-4xl md:text-6xl font-doto font-bold text-black text-center">
            gator swamp
          </h1>
          <div className="flex-1 flex justify-center md:justify-end mt-4 md:mt-0">
            <img src={GatorLogo2} alt="Gator Swamp Logo" className="size-28 md:size-40" />
          </div>
        </div>
        <div className="px-4 md:px-20 text-center">
        <h2 className="text-xl md:text-2xl font-mono text-black mb-4 text-center">
          log in
        </h2>

        {error && (
          <div className="mb-6 p-3 md:p-4 bg-white border border-black text-black text-center text-sm md:text-base">
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
            className="w-full md:w-3/4 p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
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
            className="w-full md:w-3/4 p-2 bg-white border-2 rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="w-full sm:w-2/3 md:w-1/3 bg-black text-white font-semi text-xl py-2 hover:bg-gray-900 focus:outline-none border-2 border-black transition-colors"
          >
            enter!
          </button>
        </div>
        </div>

        <div className="mt-8 text-center border-t-2 border-black pt-4 px-4">
          <span className="text-black text-sm md:text-base">not yet subscribed? </span>
          <a
            href="/register"
            className="font-bold text-black underline hover:text-gray-800 text-sm md:text-base"
          >
            register for access
          </a>
        </div>
      </form>
    </div>
  );
};
