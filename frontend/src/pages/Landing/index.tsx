import React from 'react';
import { useNavigate } from 'react-router-dom';
import clap from '../../assets/achievo-clap-transparent.png';

type Props = {
  onLogin?: () => void;
};

const Landing: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto text-center p-6">
          <img src={clap} alt="Achievo" className="mx-auto w-40 h-40 object-contain" />

          <p className="mt-4 text-gray-600 px-2 leading-relaxed">
            Your cheerful companion for a more
            <span className="font-semibold text-amber-500"> productive</span>
            <span> and </span>
            <span className="font-semibold text-amber-500">happier</span>
            <span> day</span>
          </p>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="mt-6 w-full bg-gradient-to-br from-orange-400 to-yellow-500 text-black font-medium py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Get Started
          </button>

          <div className="mt-4 text-sm text-gray-600">
            <span>Have an Account? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-amber-500 font-medium hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
  );
};

export default Landing;