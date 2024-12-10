import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from "./routes/routes"
import './index.css';
<style>
@import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&display=swap');
</style>

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
