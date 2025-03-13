import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GatorLogo2 from "../../assets/gator3.svg"; // Adding gator logo for consistency

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password
      );
      
      console.log("Registration result:", result);
      
      if (result && (result.success || result.userId)) {
        // Add a success message to console to debug
        console.log("Registration successful, navigating to login page");
        // Use replace: true to ensure proper navigation
        navigate("/login", { replace: true });
      } else {
        setError(result?.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred during registration");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-stone-100 flex items-center justify-center w-full min-h-screen p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl p-4 md:p-12 flex flex-col">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-4">
          <div className="flex-1 hidden md:block" />
          <h1 className="text-4xl md:text-6xl font-doto font-bold text-black text-center">
            gator swamp
          </h1>
          <div className="flex-1 flex justify-center md:justify-end mt-4 md:mt-0">
            <img src={GatorLogo2} alt="Gator Swamp Logo" className="size-28 md:size-40" />
          </div>
        </div>
        
        <h2 className="text-xl md:text-2xl font-mono text-black mb-4 py-2 text-center">
          register
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-white border border-black text-black text-center text-sm md:text-base">
            {error}
          </div>
        )}

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black font-medium mb-2">
            username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black font-medium mb-2">
            email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black font-medium mb-2">
            password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-6 text-center px-4 md:px-12">
          <label className="block text-black font-medium mb-2">
            confirm password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 bg-white border-2 font-mono rounded-full border-stone-100 text-black text-lg focus:outline-none"
            required
          />
        </div>

        <div className="flex justify-center px-4 md:px-12">
          <button
            type="submit"
            className="w-full sm:w-2/3 md:w-1/2 bg-black text-white font-bold text-xl py-2 md:py-3 hover:bg-gray-900 focus:outline-none border-2 border-black transition-colors"
          >
            enter!
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-black text-sm md:text-base">already registered? </span>
          <a
            href="/login"
            className="font-bold text-black underline hover:text-gray-800 text-sm md:text-base"
          >
            log in here
          </a>
        </div>
      </form>
    </div>
  );
};
