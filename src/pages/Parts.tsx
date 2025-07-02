import React from 'react';
import { PartsInventory } from '../components/Parts/PartsInventory';
import { useTheme } from '../context/ThemeContext';

export const Parts: React.FC = () => {
  const { appearance } = useTheme?.() || {};
  const fontSizeClass = appearance?.fontSize === 'large' ? 'text-lg' : appearance?.fontSize === 'small' ? 'text-sm' : appearance?.fontSize === 'extra-large' ? 'text-xl' : 'text-base';
  const compactClass = appearance?.compactMode ? 'p-2 sm:p-4' : 'p-4 sm:p-8';
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${fontSizeClass} ${compactClass}`}>
      <PartsInventory />
    </div>
  );
};