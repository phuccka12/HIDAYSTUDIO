import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LandingPage from '../pages/LandingPage';
import UserDashboard from '../pages/user/UserDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsersList from '../pages/admin/UsersList';
import AdminUserCreate from '../pages/admin/users/AdminUserCreate';
import AdminUserEdit from '../pages/admin/users/AdminUserEdit';
import ExamsList from '../pages/admin/content/ExamsList';
import LessonsList from '../pages/admin/content/LessonsList';
import ProfilePage from '../pages/ProfilePage';
import UserLayout from '../components/user/layout/UserLayout';
import WritingPractice from '../pages/user/WritingPractice';
import WritingHistory from '../pages/user/WritingHistory';
import ProtectedRoute from '../components/common/ProtectedRoute';
import NotFoundPage from '../pages/NotFoundPage';
import { ConfirmReset } from '../components/ui/ResetPassword';

const router = createBrowserRouter([
  {
    path: '/reset-password',
    element: <Layout><ConfirmReset /></Layout>,
  },
  {
    path: '/',
    element: <Layout><LandingPage /></Layout>,
  },
  {
    path: '/user',
    element: (
      <ProtectedRoute requiredRole="user">
        <UserLayout><Outlet /></UserLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <UserDashboard />,
      },
      {
        path: 'writing',
        element: <WritingPractice />,
      },
      {
        path: 'writing-history',
        element: <WritingHistory />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
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
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminUsersList /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/content/lessons',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><LessonsList /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/content/exams',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><ExamsList /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users/create',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminUserCreate /></Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users/:id/edit',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminUserEdit /></Layout>
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
  // legacy single profile route kept for compatibility
  {
    path: '/profile',
    element: (
      <ProtectedRoute requiredRole="user">
        <UserLayout><ProfilePage /></UserLayout>
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