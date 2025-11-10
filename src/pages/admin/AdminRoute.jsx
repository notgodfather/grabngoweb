import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ADMIN_EMAILS } from '../../config';

export default function AdminRoute({ children }) {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  const location = useLocation();

  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  const isAdmin = !!profile?.email && ADMIN_EMAILS.includes(profile.email.toLowerCase());

  if (!isAuthed || !isAdmin) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return children;
}
