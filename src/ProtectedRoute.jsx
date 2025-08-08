import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}
