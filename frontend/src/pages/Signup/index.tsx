import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clap from '../../assets/achievo-clap-transparent.png';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);
    setTermsError(false);

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
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(true);
      hasErrors = true;
    }
    if (!agreeToTerms) {
      setTermsError(true);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - navigate to login page
      console.log('Signup successful', data);
      navigate('/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
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
            placeholder="Enter your email or phone number"
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
              type={"text"}
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
            {/* <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
                {showPassword ? "hide" : "show"}
            </button> */}
          </div>
          {passwordError && <p className="mt-1 text-sm text-red-600">Required</p>}

          <label className="block text-sm font-medium text-gray-700 mt-4">Re-enter your password</label>
          <div className="relative">
            <input
              type={"text"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError && e.target.value.trim()) {
                  setConfirmPasswordError(false);
                }
              }}
              placeholder="Enter your password"
              className={`mt-1 block w-full rounded-full bg-white px-4 py-3 pr-12 focus:outline-none ${
                confirmPasswordError 
                  ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-300' 
                  : 'border-gray-200 focus:ring-2 focus:ring-amber-300'
              }`}
              disabled={isLoading}
            />
            {/* <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
                {showPassword ? "hide" : "show"}
            </button> */}
          </div>
          {confirmPasswordError && <p className="mt-1 text-sm text-red-600">Required</p>}

          <div className="flex items-start mt-4">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                if (termsError && e.target.checked) {
                  setTermsError(false);
                }
              }}
              className={`mt-1 h-4 w-4 text-amber-500 border-gray-300 rounded ${
                termsError ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
              I agree with the <span className="text-amber-500 font-medium hover:underline cursor-pointer">Terms and Conditions</span>
            </label>
          </div>
          {termsError && <p className="mt-1 text-sm text-red-600 ml-7">You must agree to the terms and conditions</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full bg-gradient-to-br from-orange-400 to-yellow-500 text-black font-medium py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already had an account? <button onClick={() => navigate('/login')} className="text-amber-500 font-medium hover:underline">Log in</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
