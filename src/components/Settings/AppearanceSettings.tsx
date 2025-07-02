import React, { useState } from 'react';
import { Save, Palette, Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const AppearanceSettings: React.FC = () => {
  const themeContext = useTheme();
  const [settings, setSettings] = useState({
    theme: (themeContext.theme as string) || 'light',
    primaryColor: '#003366',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    language: 'en'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Apply appearance settings globally in CRM
  const applyAppearanceSettings = (newSettings: typeof settings) => {
    // Theme
    themeContext.setTheme(newSettings.theme as typeof themeContext.theme);
    // Primary color (set CSS variable)
    document.documentElement.style.setProperty('--app-primary-color', newSettings.primaryColor);
    // Font size (set CSS variable)
    let fontSizeValue = '16px';
    switch (newSettings.fontSize) {
      case 'small': fontSizeValue = '14px'; break;
      case 'medium': fontSizeValue = '16px'; break;
      case 'large': fontSizeValue = '18px'; break;
      case 'extra-large': fontSizeValue = '20px'; break;
    }
    document.documentElement.style.setProperty('--app-font-size', fontSizeValue);
    // Compact mode (set class on body)
    if (newSettings.compactMode) {
      document.body.classList.add('crm-compact');
    } else {
      document.body.classList.remove('crm-compact');
    }
    // Animations (set class on body)
    if (!newSettings.showAnimations) {
      document.body.classList.add('crm-no-animations');
    } else {
      document.body.classList.remove('crm-no-animations');
    }
    // Language (set attribute for i18n, if used)
    document.documentElement.setAttribute('lang', newSettings.language);
    // Persist settings
    localStorage.setItem('appearanceSettings', JSON.stringify(newSettings));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      applyAppearanceSettings(settings);
      setMessage('Appearance settings updated successfully!');
    } catch (error) {
      setMessage('Failed to update appearance settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      };
      // Live update theme if changed
      if (name === 'theme') themeContext.setTheme(value as typeof themeContext.theme);
      return newSettings;
    });
  };

  const colorOptions = [
    { name: 'Navy Blue', value: '#003366' },
    { name: 'Royal Blue', value: '#1e40af' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Orange', value: '#ea580c' }
  ];

  // Theme context for appearance settings
  const { appearance } = useTheme();
  return (
    <form onSubmit={handleSubmit} className={`space-y-8 transition-colors duration-200 bg-white dark:bg-gray-900 ${appearance.compactMode ? 'space-y-4' : ''}`} style={{ fontSize: 'var(--app-font-size)' }}>
      {/* Theme Selection */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Palette className="w-6 h-6 text-[#003366] dark:text-blue-200" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors duration-200 ${settings.theme === 'light' ? 'border-[#003366] bg-blue-50 dark:bg-gray-700 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'}`}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={settings.theme === 'light'}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center space-x-3">
              <Sun className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Light</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">Clean and bright interface</p>
              </div>
            </div>
          </label>

          <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors duration-200 ${settings.theme === 'dark' ? 'border-[#003366] bg-blue-50 dark:bg-gray-700 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'}`}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={settings.theme === 'dark'}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center space-x-3">
              <Moon className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">Easy on the eyes</p>
              </div>
            </div>
          </label>

          <label className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors duration-200 ${settings.theme === 'auto' ? 'border-[#003366] bg-blue-50 dark:bg-gray-700 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'}`}>
            <input
              type="radio"
              name="theme"
              value="auto"
              checked={settings.theme === 'auto'}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center space-x-3">
              <Monitor className="w-6 h-6 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">Match system preference</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Palette className="w-6 h-6 text-[#003366] dark:text-blue-200" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Primary Color</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorOptions.map((color) => (
            <label
              key={color.value}
              className={`relative cursor-pointer rounded-lg border-2 p-4 flex items-center space-x-3 transition-colors duration-200 ${settings.primaryColor === color.value ? 'border-[#003366] dark:border-blue-400 bg-blue-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
            >
              <input
                type="radio"
                name="primaryColor"
                value={color.value}
                checked={settings.primaryColor === color.value}
                onChange={handleInputChange}
                className="sr-only"
              />
              <span
                className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 mr-3"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-gray-900 dark:text-white font-medium">{color.name}</span>
              {settings.primaryColor === color.value && (
                <span className="ml-auto text-xs px-2 py-1 rounded bg-[#003366] text-white dark:bg-blue-500">Selected</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Monitor className="w-6 h-6 text-[#003366] dark:text-blue-200" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display Options</h3>
        </div>

        <div className="space-y-6">
          {/* Font Size Dropdown */}
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Font Size</label>
            <select
              id="fontSize"
              name="fontSize"
              value={settings.fontSize}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          {/* Language Dropdown */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Language</label>
            <select
              id="language"
              name="language"
              value={settings.language}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Compact Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">Reduce spacing for denser layout</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="compactMode"
                checked={settings.compactMode}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Animations Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Show Animations</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">Enable or disable UI animations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="showAnimations"
                checked={settings.showAnimations}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-[#003366] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
};