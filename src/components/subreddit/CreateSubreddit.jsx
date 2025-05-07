import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateSubredditMutation } from '../../hooks/useSubredditData';

const CreateSubreddit = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const { mutate: createSubreddit, isPending, error } = useCreateSubredditMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.id) {
        console.error("User must be logged in");
        return;
    }

    createSubreddit({
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-dark-slate-900 pt-20 sm:pt-20 px-3 sm:px-4">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>

        {error && (
          <div className="mb-4 p-2 sm:p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {error.message}
          </div>
        )}

        <fieldset disabled={isPending}>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white dark:bg-dark-slate-800 p-4 sm:p-6 rounded-lg shadow">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-white mb-1 sm:mb-2">
                Subreddit Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg dark:bg-navy-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:text-white disabled:opacity-70"
                required
                placeholder="Enter a unique name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium dark:text-white text-gray-700 mb-1 sm:mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded-lg dark:bg-navy-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:text-white disabled:opacity-70"
                required
                placeholder="What is this subreddit about?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isPending ? 'Creating...' : 'Create Subreddit'}
            </button>
          </form>
        </fieldset>
      </div>
    </div>
  );
};

export default CreateSubreddit;