import React from 'react';
import { Lock } from 'lucide-react';

const EncryptionBadge = () => {
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-b border-blue-100 rounded-lg mx-4 my-2">
      <Lock size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-blue-700">
        Messages are secured by honey encryption
      </span>
    </div>
  );
};

export default EncryptionBadge;
