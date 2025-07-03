import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Interview from './pages/Interview';
import Report from './pages/Report';
import CareerCoach from './pages/CareerCoach';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/report" element={<Report />} />
          <Route path="/career-coach" element={<CareerCoach />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;