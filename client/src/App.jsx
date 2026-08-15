import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AdminIssueHistory from './pages/AdminIssueHistory';
import AdminUsers from './pages/AdminUsers';
import AdminIssueDetails from './pages/AdminIssueDetails';
import AdminReports from './pages/AdminReports';
import ResolvedIssues from './pages/ResolvedIssues';
import Notifications from './pages/Notifications';
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
          element={<LandingPage />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/issues" element={<BrowseIssues />} />
        <Route path="/issues/:id" element={<IssueDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/history" element={<AdminIssueHistory />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/issues/:id" element={<AdminIssueDetails />} />
        <Route path="/resolved" element={<ResolvedIssues />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
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
