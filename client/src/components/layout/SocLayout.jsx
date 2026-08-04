import React from 'react';
import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';
import LeftSidebar from './LeftSidebar';

export default function SocLayout() {
  return (
    <div className="min-h-screen bg-soc-bg flex flex-col font-sans">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
