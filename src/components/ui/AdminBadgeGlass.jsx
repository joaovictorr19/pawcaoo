import React from 'react';
import { Shield } from 'lucide-react';

const AdminBadgeGlass = ({ className = "" }) => {
  return (
    <div className={`admin-badge-container relative flex items-center justify-center w-6 h-6 ${className}`} title="Administrador Oficial">
      <style>
        {`
          .admin-badge-glass {
            background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
            box-shadow: 
              0 4px 6px -1px rgba(217, 119, 6, 0.4),
              0 2px 4px -1px rgba(217, 119, 6, 0.2),
              inset 0 2px 4px rgba(255, 255, 255, 0.7),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.4);
          }
          
          .admin-badge-shine {
            background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%);
          }
        `}
      </style>
      
      {/* Glass Container - Rounded for consistency with VerifiedBadge */}
      <div className="admin-badge-glass w-6 h-6 rounded-full flex items-center justify-center relative overflow-hidden">
        
        {/* Glossy Reflection */}
        <div className="admin-badge-shine absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" />
        
        {/* Shield Icon */}
        <Shield className="w-3 h-3 text-white drop-shadow-md z-10 fill-yellow-100/20" strokeWidth={2.5} />
      </div>
    </div>
  );
};

export default AdminBadgeGlass;