import React, { useState } from 'react';
import { Save, Bell, Mail, Smartphone, AlertCircle } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: {
      orderUpdates: true,
      inventoryAlerts: true,
      systemUpdates: false,
      marketingEmails: false,
      weeklyReports: true
    },
    pushNotifications: {
      orderUpdates: true,
      inventoryAlerts: true,
      systemAlerts: true,
      chatMessages: false
    },
    smsNotifications: {
      criticalAlerts: true,
      orderConfirmations: false,
      deliveryUpdates: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggle = (category: keyof typeof settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[typeof category]]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Notification preferences updated successfully!');
    } catch (error) {
      setMessage('Failed to update preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const NotificationSection = ({ 
    title, 
    icon: Icon, 
    description, 
    settings: sectionSettings, 
    category 
  }: {
    title: string;
    icon: React.ComponentType<any>;
    description: string;
    settings: Record<string, boolean>;
    category: keyof typeof settings;
  }) => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6 text-[#003366] dark:text-blue-200" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(sectionSettings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300">
                {getSettingDescription(key)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleToggle(category, key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-900 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      orderUpdates: 'Get notified when order status changes',
      inventoryAlerts: 'Receive alerts for low stock items',
      systemUpdates: 'System maintenance and update notifications',
      marketingEmails: 'Promotional offers and product updates',
      weeklyReports: 'Weekly performance and analytics reports',
      systemAlerts: 'Critical system notifications',
      chatMessages: 'New messages and mentions',
      criticalAlerts: 'Emergency and critical system alerts',
      orderConfirmations: 'Order placement confirmations',
      deliveryUpdates: 'Delivery status and tracking updates'
    };
    return descriptions[key] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <NotificationSection
        title="Email Notifications"
        icon={Mail}
        description="Manage your email notification preferences"
        settings={settings.emailNotifications}
        category="emailNotifications"
      />
      <NotificationSection
        title="Push Notifications"
        icon={Smartphone}
        description="Control push notifications on your devices"
        settings={settings.pushNotifications}
        category="pushNotifications"
      />
      <NotificationSection
        title="SMS Notifications"
        icon={Bell}
        description="Manage SMS alerts and updates"
        settings={settings.smsNotifications}
        category="smsNotifications"
      />
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 transition-colors">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Note</p>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-100 mt-1">
          Critical security alerts and system notifications cannot be disabled for your safety and account security.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-900 focus:ring-2 focus:ring-[#003366] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </form>
  );
};