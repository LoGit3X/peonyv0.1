import { FC, ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';
import Header from './Header';
import { useLocation } from 'wouter';

interface MainLayoutProps {
  children: ReactNode;
}

// Add a key to localStorage to check sidebar state
const SIDEBAR_KEY = 'peony-sidebar-collapsed';

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_KEY);
    if (savedState) {
      setSidebarCollapsed(savedState === 'true');
    }

    // Set up event listener for sidebar state changes
    const handleStorageChange = () => {
      const currentState = localStorage.getItem(SIDEBAR_KEY);
      if (currentState) {
        setSidebarCollapsed(currentState === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('sidebarStateChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarStateChange', handleStorageChange);
    };
  }, []);

  // Extract page title from location
  const getTitle = () => {
    switch (location) {
      case '/':
        return 'داشبورد';
      case '/materials':
        return 'مدیریت مواد اولیه';
      case '/inventory':
        return 'مدیریت انبار';
      case '/recipes':
        return 'مدیریت رسپی‌ها';
      case '/prices':
        return 'قیمت‌ها';
      case '/reports':
        return 'گزارش‌ها';
      case '/settings':
        return 'تنظیمات';
      default:
        return 'کافه پیونی';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile navbar */}
      <MobileNavbar />

      {/* Main content area with transition for sidebar toggle */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <Header title={getTitle()} />

        {/* Main content with scrolling */}
        <main className="flex-1 overflow-y-auto bg-[#2C2F33] pl-4 pr-2 py-4 lg:pl-6 lg:pr-3 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
