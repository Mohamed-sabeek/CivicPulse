import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import TrendingIssues from './components/TrendingIssues';
import Statistics from './components/Statistics';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BrowseIssues from './pages/BrowseIssues';
import IssueDetails from './pages/IssueDetails';
import AdminDashboard from './pages/AdminDashboard';
import ResolvedIssues from './pages/ResolvedIssues';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = () => (
  <>
    <Navbar />
    <Hero />
    <HowItWorks />
    <TrendingIssues />
    <Statistics />
    <CTA />
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            localStorage.getItem('token') ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/issues" element={<BrowseIssues />} />
        <Route path="/issues/:id" element={<IssueDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/resolved" element={<ResolvedIssues />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

