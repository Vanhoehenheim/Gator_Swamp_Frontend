import { useState } from "react";
// import { useAuth } from "../../contexts/AuthContext"; // Removed unused import
import { useTheme } from "../../contexts/ThemeContext";
// import GatorLogo from "../../assets/gator.svg"; // Removed unused import
// import GatorLogo1 from "../../assets/gator2.svg"; // Removed unused import
import GatorLogo2 from "../../assets/gator3.svg";
import { Sun, Moon } from 'lucide-react';
import { useLoginMutation } from '../../hooks/useAuthMutations';
import { Analytics } from "@vercel/analytics/react"
// import { useToast } from "@/components/ui/use-toast" // Removed useToast import

// Helper function to get user-friendly error message
function getLoginErrorMessage(error) {
  if (!error || !error.message) {
    return "An unexpected error occurred. Please try again.";
  }
  const message = error.message.toLowerCase();
  if (message.includes('failed to fetch')) {
    return "Oops, our server is taking a break, try again later";
  } else if (message.includes('invalid') && (message.includes('credential') || message.includes('email'))) {
    return "Please check your credentials again";
  } else if (message.includes('invalid response structure')) {
    // Treat this specific structure error as likely bad credentials, covering potential backend inconsistencies
    return "Please check your credentials again";
  } else {
    // Default or fallback message
    return error.message;
  }
}

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { darkMode, toggleDarkMode } = useTheme();
  // const { toast } = useToast() // Removed useToast initialization

  const { mutate: login, isPending, error } = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="bg-stone-100 dark:bg-dark-slate-900 flex items-center justify-center w-full min-h-screen p-4 transition-colors">
      <Analytics />
      <fieldset disabled={isPending} className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col justify-center align-middle">
          <div className="flex flex-col md:flex-row items-center justify-between w-full mb-4">
            <div className="flex-1 hidden md:block" />
            <h1 className="text-4xl md:text-6xl font-doto font-bold text-black dark:text-white text-center">
              gator swamp
            </h1>
            <div className="flex-1 flex justify-center md:justify-end mt-4 md:mt-0">
              <img src={GatorLogo2} alt="Gator Swamp Logo" className="size-28 md:size-40 text-black dark:text-white" />
            </div>
          </div>
          <div className="px-4 md:px-20 text-center">
            <h2 className="text-xl md:text-2xl font-mono text-black dark:text-white mb-4 text-center">
              log in
            </h2>

            {error && (
              <div className="mb-6 p-3 md:p-4 bg-white dark:bg-dark-slate-700 border border-black dark:border-dark-slate-600 text-red-600 dark:text-red-400 text-center text-sm md:text-base">
                {getLoginErrorMessage(error)}
              </div>
            )}

            <div className="mb-6">
              <label className="block font-medium text-black dark:text-white mb-2">
                email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full md:w-3/4 p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none disabled:opacity-70"
                required
              />
            </div>

            <div className="mb-8">
              <label className="block font-medium text-black dark:text-white mb-2">
                password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full md:w-3/4 p-2 bg-white dark:bg-navy-900 border-2 font-mono rounded-full border-stone-100 dark:border-dark-slate-600 text-black dark:text-white text-lg focus:outline-none disabled:opacity-70"
                required
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full sm:w-2/3 md:w-1/3 bg-black dark:bg-white text-white dark:text-navy-800 font-semi text-xl py-2 hover:bg-gray-900 dark:hover:bg-gray-200 focus:outline-none border-2 border-black dark:border-white transition-colors disabled:opacity-50"
              >
                {isPending ? 'Logging in...' : 'enter!'}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center border-t-2 border-black dark:border-white pt-4 px-4">
            <span className="text-black dark:text-white text-sm md:text-base">not yet subscribed? </span>
            <a
              href="/register"
              className="font-bold text-black dark:text-white underline hover:text-gray-800 dark:hover:text-gray-300 text-sm md:text-base"
            >
              register for access
            </a>
          </div>
        </form>
      </fieldset>
        
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
    </div>
  );
};
