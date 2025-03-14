import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import GatorLogo2 from "../../assets/gator3.svg"; // Adding gator logo for consistency
import { Sun, Moon } from 'lucide-react';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
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
    <div className="bg-stone-100 dark:bg-dark-slate-900 flex items-center justify-center w-full min-h-screen p-4 transition-colors">
      <form onSubmit={handleSubmit} className="w-full bg-stone-100 dark:bg-dark-slate-900 max-w-2xl p-4 md:p-12 flex flex-col">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-4">
          <div className="flex-1 hidden md:block" />
          <h1 className="text-4xl md:text-6xl font-doto font-bold text-black dark:text-white text-center">
            gator swamp
          </h1>
          <div className="flex-1 flex justify-center md:justify-end mt-4 md:mt-0">
            <img src={GatorLogo2} alt="Gator Swamp Logo" className="size-28 md:size-40" />
          </div>
        </div>
        
        <h2 className="text-xl md:text-2xl font-mono text-black dark:text-white mb-4 py-2 text-center">
          register
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-white dark:bg-dark-slate-700 border border-black dark:border-dark-slate-600 text-black dark:text-white text-center text-sm md:text-base">
            {error}
          </div>
        )}

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black dark:text-white font-medium mb-2">
            username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black dark:text-white font-medium mb-2">
            email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-4 text-center px-4 md:px-12">
          <label className="block text-black dark:text-white font-medium mb-2">
            password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none"
            required
          />
        </div>

        <div className="mb-6 text-center px-4 md:px-12">
          <label className="block text-black dark:text-white font-medium mb-2">
            confirm password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none"
            required
          />
        </div>

        <div className="flex justify-center px-4 md:px-12">
          <button
            type="submit"
            className="w-full sm:w-2/3 md:w-1/2 bg-black dark:bg-white text-white dark:text-navy-800 font-bold text-xl py-2 md:py-3 hover:bg-gray-900 dark:hover:bg-gray-200 focus:outline-none border-2 border-black dark:border-white transition-colors"
          >
            enter!
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-black dark:text-white text-sm md:text-base">already registered? </span>
          <a
            href="/login"
            className="font-bold text-black dark:text-white underline hover:text-gray-800 dark:hover:text-gray-300 text-sm md:text-base"
          >
            log in here
          </a>
        </div>
        
        {/* Dark mode toggle */}
        <div className="absolute top-4 right-4">
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
        </div>
      </form>
    </div>
  );
};
