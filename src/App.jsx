import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Component to handle app layout
const AppLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-stone-100 dark:bg-dark-slate-900 dark:text-gray-200 mx-0 min-h-screen transition-colors duration-200">
          <AppLayout />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;