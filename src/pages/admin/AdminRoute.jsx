import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// --- NEW: Import the admin email from your central config file ---
import { ADMIN_EMAIL } from '../../config';

export default function AdminRoute({ children }) {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  const location = useLocation();

  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  // --- UPDATED: The check now uses the imported email ---
  const isAdmin = profile?.email === ADMIN_EMAIL;

  if (!isAuthed || !isAdmin) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return children;
}
