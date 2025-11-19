import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import Rewards from './pages/Rewards';
import Settings from './pages/Settings';
import ToDo from './pages/ToDo';
import AddTask from './pages/AddTask';
import Layout from './components/layout';
import { initializeActivityTracking, isExtensionEnvironment } from './utils/extensionUtils';


function App() {
  useEffect(() => {
    // Initialize extension activity tracking if running in extension environment
    if (isExtensionEnvironment()) {
      console.log('Initializing extension activity tracking...');
      initializeActivityTracking();
    }
  }, []);

  return (
    <Router>
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
          {/* Redirect any unknown routes to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;