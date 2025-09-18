import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Not Found</h2>
      <p className="text-gray-600">The page you requested does not exist.</p>
      <p>
        <Link to="/" className="text-indigo-600 hover:underline">
          Go back home
        </Link>
      </p>
    </section>
  );
}

export default NotFoundPage;
