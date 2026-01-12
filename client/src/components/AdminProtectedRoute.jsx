import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Forbidden from '../pages/errors/Forbidden';
import Loading from './Loading';

const AdminProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';
    
    if (!user) {
      // No user logged in, redirect to login
      navigate('/auth?mode=login');
    } else if (!isAdmin) {
      // User is not admin, show forbidden
      setHasAccess(false);
    } else {
      // User is admin, allow access
      setHasAccess(true);
    }
    
    setIsLoading(false);
  }, [user, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  if (!hasAccess) {
    return <Forbidden />;
  }

  return children;
};

export default AdminProtectedRoute;
