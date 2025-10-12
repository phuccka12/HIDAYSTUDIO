import React from 'react';
import UserHeader from './UserHeader';
import UserSidebar from './UserSidebar';

const UserLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1">
          <UserSidebar />
        </div>
        <main className="col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;