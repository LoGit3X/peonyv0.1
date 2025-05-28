import { FC, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, User } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Utensils,
  List,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'داشبورد', href: '/' },
  { icon: Package, label: 'مواد اولیه', href: '/materials' },
  { icon: Utensils, label: 'رسپی‌ها', href: '/recipes' },
  { icon: List, label: 'منو', href: '/menu' },
  { icon: BarChart3, label: 'فروش', href: '/sales' },
  { icon: FileText, label: 'گزارش‌ها', href: '/reports' },
  { icon: Settings, label: 'تنظیمات', href: '/settings' },
];

const MobileNavbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#23272A] z-50 shadow-md">
        <div className="flex items-center justify-between p-4">
          <button 
            className="text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center mr-2">
              <img src="/Logo.png" alt="Peony Cafe" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-lg font-bold text-[#5865F2]">کافه پیونی</h1>
          </div>
          <button className="text-white focus:outline-none">
            <User className="text-[#5865F2] h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "lg:hidden fixed inset-0 z-40 bg-[#2C2F33] bg-opacity-95 pt-16 transform transition-all duration-300 ease-in-out",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="absolute top-4 left-4">
          <button 
            className="text-white focus:outline-none"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={cn(
                "flex items-center px-4 py-3 text-base text-gray-300 rounded-lg hover:bg-[#23272A] transition-all duration-200 ease-in-out",
                location === item.href ? "bg-[#23272A] text-white border-r-4 border-[#5865F2]" : ""
              )}
            >
              <item.icon className="text-[#5865F2] ml-3 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default MobileNavbar;
