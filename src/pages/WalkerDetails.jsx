import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WalkerDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect /WalkerDetails?id=123 to /UserProfile?id=123
    navigate(createPageUrl('UserProfile') + location.search, { replace: true });
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-orange-500"></div>
    </div>
  );
}