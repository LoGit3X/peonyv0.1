import { FC, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Utensils,
  List,
  BarChart3,
  FileText,
  Settings,
  User,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Warehouse
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'داشبورد', href: '/' },
  { icon: Package, label: 'مواد اولیه', href: '/materials' },
  { icon: Warehouse, label: 'مدیریت انبار', href: '/inventory' },
  { icon: Utensils, label: 'رسپی‌ها', href: '/recipes' },
  { icon: Calculator, label: 'قیمت‌ها', href: '/prices' },
  { icon: BarChart3, label: 'سفارش‌ها', href: '/orders' },
  { icon: FileText, label: 'گزارش‌ها', href: '/reports' },
  { icon: Settings, label: 'تنظیمات', href: '/settings' },
];

// Add a key to localStorage to remember sidebar state
const SIDEBAR_KEY = 'peony-sidebar-collapsed';

const Sidebar: FC = () => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_KEY);
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
  }, []);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem(SIDEBAR_KEY, String(newState));
    
    // Dispatch custom event to notify other components about the change
    window.dispatchEvent(new Event('sidebarStateChange'));
  };

  return (
    <div className={cn(
      "hidden lg:flex flex-col h-screen bg-[#23272A] transition-all duration-300 ease-in-out relative",
      collapsed ? "w-20" : "w-37  "
    )}>
      {/* Toggle button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -left-3 top-20 bg-[#5865F2] text-white p-1 rounded-full shadow-md z-10 hover:bg-[#4752C4] transition-colors"
        aria-label={collapsed ? "باز کردن منو" : "بستن منو"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={cn(
        "flex items-center p-4 border-b border-gray-700",
        collapsed ? "justify-center" : "justify-center"
      )}>
        <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center">
          <img src="/Logo.png" alt="Peony Cafe" className="h-full w-full object-contain relative" style={{ top: '-5px' }} />
        </div>
        {!collapsed && (
           <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-[#5865F2]">کافه پیونی</h1>
            <p className="text-xs text-gray-400">Peony Café</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center py-3 text-sm text-gray-300 rounded-lg hover:bg-[#2C2F33] hover:shadow-[0_0_12px_2px_rgba(88,101,242,0.45)] group transition-all duration-200 ease-in-out",
                location === item.href 
                  ? "bg-[#2C2F33] text-white border-r-4 border-[#5865F2]" 
                  : "",
                collapsed ? "justify-center px-2" : "px-4"
              )}
              title={collapsed ? item.label : ""}
            >
              <item.icon className={cn(
                "text-[#5865F2] h-5 w-5",
                collapsed ? "" : "ml-3"
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className={cn(
        "p-4 border-t border-gray-700",
        collapsed ? "flex justify-center" : ""
      )}>
        <div className={cn(
          "flex items-center", 
          collapsed ? "justify-center" : ""
        )}>
          <div className="rounded-full bg-[#2C2F33] h-8 w-8 flex items-center justify-center">
            <User className="text-[#5865F2] h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="mr-3">
              <p className="text-sm font-medium text-white">ادمین</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
