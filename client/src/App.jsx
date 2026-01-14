import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import InterviewRoom from './pages/InterviewRoom';
import Dashboard from './pages/Dashboard';
// Security Guard: Checks if user has a key (token)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/chat" 
          element={
            <PrivateRoute>
              <InterviewRoom />
            </PrivateRoute>
          } 
        />
        <Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } 
/>
      </Routes>
    </Router>
  );
}

export default App;