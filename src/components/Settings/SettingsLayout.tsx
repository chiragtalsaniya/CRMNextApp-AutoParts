import React, { useState } from 'react';
import { User, Shield, Bell, Database, Palette, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const settingsTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: User, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'security', label: 'Security', icon: Shield, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { id: 'system', label: 'System', icon: Database, roles: ['super_admin', 'admin'] },
  { id: 'appearance', label: 'Appearance', icon: Palette, roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { id: 'regional', label: 'Regional', icon: Globe, roles: ['super_admin', 'admin', 'manager'] },
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const availableTabs = settingsTabs.filter(tab => 
    tab.roles.includes(user?.role || '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#003366] text-[#003366]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {React.cloneElement(children as React.ReactElement, { activeTab })}
        </div>
      </div>
    </div>
  );
};