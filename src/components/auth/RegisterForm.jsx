import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
    <div className="bg-stone-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl p-12">
        <h1 className="text-6xl font-doto font-bold text-black text-center flex-2">
          gator swamp
        </h1>
        <h2 className="text-2xl font-mono text-black mb-4 py-2 text-center">
          register
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4  text-center">
          <label className="block text-gray-700 text-sm font-bold mb-2">
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

        <div className="mb-4 text-center">
          <label className="block text-gray-700 text-sm font-bold mb-2">
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

        <div className="mb-4 text-center">
          <label className="block text-gray-700 text-sm font-bold mb-2">
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

        <div className="mb-6 text-center">
          <label className="block text-gray-700 text-sm font-bold mb-2">
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

        <button
          type="submit"
          className="w-full bg-black text-white font-bold text-xl py-3 hover:bg-gray-900 focus:outline-none border-2 border-black transition-colors"
        >
          enter!
        </button>
      </form>
    </div>
  );
};
