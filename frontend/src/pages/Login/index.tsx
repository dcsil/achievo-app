import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clap from '../../assets/achievo-clap-transparent.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Dummy credentials
  const DUMMY_CREDENTIALS = {
    email: 'paul.paw@example.com',
    password: 'password123'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError(false);
    setPasswordError(false);

    // Validate fields
    let hasErrors = false;
    if (!email.trim()) {
      setEmailError(true);
      hasErrors = true;
    }
    if (!password.trim()) {
      setPasswordError(true);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setIsLoading(true);

    if (email === DUMMY_CREDENTIALS.email && password === DUMMY_CREDENTIALS.password) {
    // Success - navigate to home page
    console.log('Login successful', { email, remember });
    navigate('/home');
    } else {
    setError('Invalid email or password. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-amber-100 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto text-center p-6">
          <img src={clap} alt="Achievo" className="mx-auto w-36 h-36 object-contain" />

          <form onSubmit={handleSubmit} className="mt-6 text-left">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError && e.target.value.trim()) {
                  setEmailError(false);
                }
              }}
              placeholder="Enter your email"
              className={`mt-1 block w-full rounded-full bg-white px-4 py-3 focus:outline-none ${
                emailError 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-300' 
                  : 'border-gray-200 focus:ring-2 focus:ring-amber-300'
              }`}
              disabled={isLoading}
            />
            {emailError && <p className="mt-1 text-sm text-red-600">Required</p>}

            <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError && e.target.value.trim()) {
                    setPasswordError(false);
                  }
                }}
                placeholder="Enter your password"
                className={`mt-1 block w-full rounded-full bg-white px-4 py-3 pr-12 focus:outline-none ${
                  passwordError 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-300' 
                    : 'border-gray-200 focus:ring-2 focus:ring-amber-300'
                }`}
                disabled={isLoading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-sm text-red-600">Required</p>}

            {/* remember me (for later) */}
            {/* <div className="flex items-center justify-between mt-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 text-amber-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>

              <a href="#" className="text-sm text-amber-500 font-medium hover:underline">Forgot password?</a>
            </div> */}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full bg-gradient-to-br from-orange-400 to-yellow-500 text-black font-medium py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">Don't have an account? <button onClick={() => navigate('/signup')} className="text-amber-500 font-medium hover:underline">Sign up</button></p>
          </form>
        </div>
      </div>
  );
};

export default LoginPage;
