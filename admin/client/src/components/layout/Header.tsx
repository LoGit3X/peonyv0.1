import { FC, useState, useEffect } from 'react';
import { Clock, Calendar, LayoutDashboard, Package, Warehouse, Utensils, Calculator, BarChart3, FileText, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { getJalaliDate, getJalaliDayAndTime, getJalaliDayName } from '@/lib/utils';

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({ title }) => {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(getJalaliDayAndTime());
  const [currentDate, setCurrentDate] = useState(getJalaliDate());
  const [currentDay, setCurrentDay] = useState(getJalaliDayName());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getJalaliDayAndTime());
      setCurrentDate(getJalaliDate());
      setCurrentDay(getJalaliDayName());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const getPageTitle = () => {
    if (location === '/') return 'داشبورد';
    if (location === '/materials') return 'مدیریت مواد اولیه';
    if (location === '/recipes') return 'مدیریت رسپی‌ها';
    if (location === '/prices') return 'قیمت‌ها';
    if (location === '/sales') return 'گزارش فروش';
    if (location === '/reports') return 'گزارش‌ها';
    if (location === '/settings') return 'تنظیمات';
    return title;
  };

  return (
    <header className="bg-[#23272A] shadow-md lg:py-4 py-2 px-6 lg:mt-0 mt-16">
      <div className="relative flex items-center justify-between flex-row-reverse w-full">
        {/* Left: Time/Date */}
        <div className="hidden md:block">
          <div className="flex bg-[#2C2F33] rounded-full px-4 py-2 items-center gap-2">
            <Calendar className="text-[#5865F2] ml-2 h-4 w-4" />
            <span className="text-sm text-gray-300 ml-2">{currentDay}، {currentDate}</span>
            <span className="text-gray-500 mx-2">|</span>
            <Clock className="text-[#5865F2] ml-2 h-4 w-4" />
            <span className="text-sm text-gray-300">{currentTime}</span>
          </div>
        </div>
        {/* Center: Title */}
        {/* Center: Title as styled button with icon */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max z-10">
          <div className="flex items-center bg-[#2C2F33] rounded-full px-4 py-2 gap-2 shadow-[0_0_12px_2px_rgba(88,101,242,0.45)]">
            {/* Icon and title dynamically from menu */}
            {(() => {
              const menuIcons = {
                '/': LayoutDashboard,
                '/materials': Package,
                '/inventory': Warehouse,
                '/recipes': Utensils,
                '/prices': Calculator,
                '/orders': BarChart3,
                '/reports': FileText,
                '/settings': Settings,
              };
              const menuTitles = {
                '/': 'داشبورد',
                '/materials': 'مدیریت مواد اولیه',
                '/inventory': 'مدیریت انبار',
                '/recipes': 'مدیریت رسپی‌ها',
                '/prices': 'قیمت‌ها',
                '/orders': 'سفارش‌ها',
                '/reports': 'گزارش‌ها',
                '/settings': 'تنظیمات',
              };
              const pageTitle = menuTitles[location as keyof typeof menuTitles] || title;
              const PageIcon = menuIcons[location as keyof typeof menuIcons];
              return (
                <>
                  {PageIcon && <PageIcon className="text-[#5865F2] ml-2 h-4 w-4" />}
                  <span className="text-sm font-bold text-white text-center whitespace-nowrap">{pageTitle}</span>
                </>
              );
            })()}
          </div>
        </div>
        {/* Right: Empty for spacing or future actions */}
        <div className="w-32 md:w-40 lg:w-48" />
      </div>
    </header>
  );
};

export default Header;
