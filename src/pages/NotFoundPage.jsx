import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <div className="w-20 h-20 rounded-full bg-forest-50 text-forest-600 mx-auto flex items-center justify-center font-extrabold text-2xl font-heading shadow-inner">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-brandText-secondary max-w-md mx-auto">
        The healthcare page or medicine you are looking for doesn't exist or has been relocated.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" size="md" leftIcon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" size="md" leftIcon={Home} onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
