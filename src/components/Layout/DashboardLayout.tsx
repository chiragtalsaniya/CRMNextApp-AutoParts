import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Redesigned Sticky Top Bar */}
      <Header onMenuClick={handleSidebarToggle} />
      {/* Main Content Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Redesigned Sidebar */}
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        {/* Main Section */}
        <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};