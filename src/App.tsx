import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import { Layout } from './components/Layout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackPage } from './pages/TrackPage';
import { VisitPage } from './pages/VisitPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/LoginPage';
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminQueuePage } from './pages/admin/QueuePage';
import { PatientProfilePage } from './pages/admin/PatientProfilePage';
import { AdminPaymentsPage } from './pages/admin/PaymentsPage';
import { AdminSearchPage } from './pages/admin/SearchPage';
import { AdminSettingsPage } from './pages/admin/SettingsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/confirmation/:uid" element={<ConfirmationPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/visit" element={<VisitPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/queue" element={<AdminQueuePage />} />
            <Route path="/admin/patient/:uid" element={<PatientProfilePage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/search" element={<AdminSearchPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;