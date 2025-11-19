import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import Rewards from './pages/Rewards';
import Settings from './pages/Settings';
import ToDo from './pages/ToDo';
import AddTask from './pages/AddTask';
import Layout from './components/layout';
import { BlindBoxSeriesProvider } from './api-contexts/blindbox/get-blindbox-series';
import { BlindBoxFiguresProvider } from './api-contexts/blindbox/get-blindbox-figures';
import { BlindBoxPurchaseProvider } from './api-contexts/blindbox/purchase-blindbox';
import { useCustomCursor } from './utils/use-custom-cursor';
import { initializeActivityTracking, isExtensionEnvironment } from './utils/extensionUtils';


// Create a wrapper component to access useLocation
function AppContent() {
  const [allFigures, setAllFigures] = useState([]);
  const location = useLocation();

  // Load figures for cursor from localStorage
  useEffect(() => {
    const loadFigures = async () => {
      try {
        const savedFigures = localStorage.getItem('cursor_figures');
        if (savedFigures) {
          setAllFigures(JSON.parse(savedFigures));
        }
      } catch (error) {
        console.error('Failed to load cursor figures:', error);
      }
    };
    loadFigures();

    const handleFiguresUpdate = () => {
      loadFigures();
    };

    window.addEventListener('figures-updated', handleFiguresUpdate);
    return () => window.removeEventListener('figures-updated', handleFiguresUpdate);
  }, []);

  // Only apply cursor on authenticated pages (not login/signup/landing)
  const isAuthPage = ['/', '/login', '/signup'].includes(location.pathname);
  const figuresForCursor = isAuthPage ? [] : allFigures;

  // Apply cursor globally
  useCustomCursor(figuresForCursor);

  useEffect(() => {
    // Initialize extension activity tracking if running in extension environment
    if (isExtensionEnvironment()) {
      console.log('Initializing extension activity tracking...');
      initializeActivityTracking();
    }
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/rewards" element={<Layout><Rewards /></Layout>} />
        <Route path="/todo" element={<Layout><ToDo /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/add-task" element={<Layout><AddTask /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BlindBoxSeriesProvider>
      <BlindBoxFiguresProvider>
        <BlindBoxPurchaseProvider>
          <Router>
            <AppContent />
          </Router>
        </BlindBoxPurchaseProvider>
      </BlindBoxFiguresProvider>
    </BlindBoxSeriesProvider>
  );
}

export default App;