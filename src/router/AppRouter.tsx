import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LandingPage from '../pages/LandingPage';
import UserDashboard from '../pages/user/UserDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><LandingPage /></Layout>,
  },
  {
    path: '/user-dashboard',
    element: (
      <ProtectedRoute requiredRole="user">
        <Layout><UserDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin-dashboard',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout><UserDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminDashboard /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout><ProfilePage /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Layout><NotFoundPage /></Layout>,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;