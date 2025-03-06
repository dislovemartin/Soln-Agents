import React, { ReactNode } from 'react';

interface AgentLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

/**
 * Layout component for the agent interface
 * Provides structure for sidebar, header, and main content
 */
const AgentLayout: React.FC<AgentLayoutProps> = ({ children, sidebar, header }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:block">
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        {header}

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AgentLayout;
