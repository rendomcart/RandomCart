import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-8xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        The admin page you are looking for doesn't exist or you don't have access to it.
      </p>
      <Link 
        to="/" 
        className="bg-primary text-white px-8 py-3 rounded font-medium hover:bg-opacity-90 transition-colors shadow-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
