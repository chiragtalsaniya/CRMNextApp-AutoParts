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
    <div className={theme === 'dark' ? 'min-h-screen bg-gray-900' : 'min-h-screen bg-gray-50'}>
      <div className="flex">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        <div className="flex-1">
          <Header onMenuClick={handleSidebarToggle} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};