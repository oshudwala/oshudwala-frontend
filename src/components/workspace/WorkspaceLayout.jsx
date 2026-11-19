import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import WorkspaceSidebar from './WorkspaceSidebar';
import WorkspaceHeader from './WorkspaceHeader';
import { useAuth } from '../../context/AuthContext';

export const WorkspaceLayout = ({ roleTitle }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const defaultRoleTitle = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin Console';
      case 'DOCTOR':
        return 'Doctor Clinical Workspace';
      case 'PHARMACY':
      case 'PHARMACIST':
        return 'Pharmacy Operations';
      case 'RIDER':
        return 'Rider Delivery Desk';
      case 'RECEPTIONIST':
        return 'Clinic Reception Desk';
      default:
        return 'Workspace OS';
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex text-brandText-main selection:bg-forest-100 selection:text-forest-800">
      {/* Role Sidebar */}
      <WorkspaceSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <WorkspaceHeader
          roleTitle={roleTitle || defaultRoleTitle()}
          onToggleSidebar={() => {
            // On desktop toggle collapse, on mobile toggle drawer
            if (window.innerWidth < 1024) {
              setIsMobileOpen((prev) => !prev);
            } else {
              setIsCollapsed((prev) => !prev);
            }
          }}
          isSidebarCollapsed={isCollapsed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
