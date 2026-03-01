import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { ROUTES } from "../config";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="text-gray-500 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link to={ROUTES.HOME}>
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
