import React from "react";
import BottomNavigation from "./BottomNavigation";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default SimpleLayout;
