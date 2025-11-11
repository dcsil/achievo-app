import React, { useState } from 'react';
import clap from '../../assets/achievo-clap.png';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dummy credentials
  const DUMMY_CREDENTIALS = {
    email: 'user@achievo.com',
    password: 'password123'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (email === DUMMY_CREDENTIALS.email && password === DUMMY_CREDENTIALS.password) {
        // Success - in a real app, this would redirect or set auth state
        alert('Login successful! Welcome to Achievo!');
        console.log('Login successful', { email, remember });
        // TODO: Replace with proper navigation/auth state management
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 block w-full rounded-full border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300"
              required
              disabled={isLoading}
            />

            <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 block w-full rounded-full border-gray-200 bg-white px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
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

            <p className="mt-4 text-center text-sm text-gray-600">Don't have an account? <a href="#" className="text-amber-500 font-medium hover:underline">Sign up</a></p>
          </form>
        </div>
      </div>
  );
};

export default LoginForm;
