import React, { ReactNode } from 'react';

interface TabProps {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavigationProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  tabs: TabProps[];
}

export function TabNavigation({ activeTab, onChange, tabs }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}