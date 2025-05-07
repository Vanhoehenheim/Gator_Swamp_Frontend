import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../config';

const CreatePost = () => {
  const { currentUser, authFetch } = useAuth();
  const { subredditId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [error, setError] = useState('');

  const createPostMutation = useMutation({
    mutationFn: async (newPostData) => {
        const response = await authFetch(`${config.apiUrl}/post`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPostData),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create post');
          }
          return data;
    },
    onSuccess: (data) => {
        console.log('Post created successfully:', data);
        queryClient.invalidateQueries({ queryKey: ['posts', subredditId] });
        navigate(`/r/${subredditId}`);
    },
    onError: (err) => {
        console.error('Error creating post:', err);
        setError(err.message || 'An unexpected error occurred.');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!currentUser?.id || !subredditId) {
        setError("User or subreddit information is missing.");
        return;
    }

    createPostMutation.mutate({
        title: formData.title.trim(),
        content: formData.content.trim(),
        authorId: currentUser.id,
        subredditId: subredditId
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
    <div className="max-w-2xl mx-auto pt-20 px-4 mt-8">

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <fieldset disabled={createPostMutation.isPending}>
        <form onSubmit={handleSubmit} className="space-y-6 dark:bg-dark-slate-800 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              post title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-slate-900 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="8"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-slate-900 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/r/${subredditId}`)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-white disabled:opacity-50"
              disabled={createPostMutation.isPending}
            >
              cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {createPostMutation.isPending ? 'creating...' : 'create post'}
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
};

export default CreatePost;