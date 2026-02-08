import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary text-white">
      <div className="text-center p-8">
        <h1 className="text-9xl font-bold mb-4">404</h1>
        <h2 className="text-4xl font-semibold mb-4">הדף לא נמצא</h2>
        <p className="text-xl mb-8">מצטערים, הדף שחיפשת לא קיים</p>
        <Link
          to="/"
          className="bg-white text-primary px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all inline-block"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
