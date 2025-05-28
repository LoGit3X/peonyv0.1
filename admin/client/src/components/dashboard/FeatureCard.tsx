import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  variant: 'materials' | 'recipes' | 'menu' | 'orders' | 'reports' | 'prices';
}

const FeatureCard: FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  href,
  variant
}) => {
  const variantClass = {
    materials: 'bg-gradient-to-b from-[#2563eb] to-[#23272A]',
    recipes: 'bg-gradient-to-b from-[#2563eb] to-[#23272A]',
    prices: 'bg-gradient-to-b from-[#2563eb] to-[#23272A]',
    orders: 'bg-gradient-to-b from-[#8EC5FC] to-[#E0C3FC]',
    reports: 'bg-gradient-to-b from-[#8EC5FC] to-[#E0C3FC]',
    menu: 'bg-gradient-to-b from-[#8EC5FC] to-[#E0C3FC]'
  };

  // رنگ‌های تیره برای پس‌زمینه بیرونی آیکون‌ها
  const iconBgClass = {
    materials: 'bg-[#2C2F33]',
    recipes: 'bg-[#2C2F33]',
    prices: 'bg-[#2C2F33]',
    orders: 'bg-[#8EC5FC]',
    reports: 'bg-[#8EC5FC]',
    menu: 'bg-[#8EC5FC]'
  };

  // رنگ‌های آیکون‌ها
  const iconColor = {
    materials: 'text-white',
    recipes: 'text-white',
    prices: 'text-white',
    menu: 'text-white',
    orders: 'text-white',
    reports: 'text-white'
  };

  const buttonClass = {
    materials: 'bg-[#343a40] hover:bg-[#343a40] text-white',
    recipes: 'bg-[#343a40] hover:bg-[#343a40] text-white',
    prices: 'bg-[#343a40] hover:bg-[#343a40] text-white',
    orders: 'bg-[#4b6cb7] hover:bg-[#35518a] text-white',
    reports: 'bg-[#4b6cb7] hover:bg-[#35518a] text-white',
    menu: 'bg-[#4b6cb7] hover:bg-[#35518a] text-white'
  };

  const badgeClass = {
    materials: 'bg-[#FFA000] bg-opacity-50',
    recipes: 'bg-[#FF416C] bg-opacity-50',
    prices: 'bg-[#00b09b] bg-opacity-50',
    orders: 'bg-[#8EC5FC] bg-opacity-50',
    reports: 'bg-[#8EC5FC] bg-opacity-50',
    menu: 'bg-[#8EC5FC] bg-opacity-50'
  };

  return (
    <div className={cn(
      "rounded-xl overflow-hidden shadow-lg card-3d shine-effect border border-blue-400 border-opacity-40 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
      variantClass[variant]
    )} style={{boxSizing: 'border-box'}}>
      <div className="p-5 flex flex-col items-center justify-center text-center">
        <div className="flex justify-center items-center mb-4 w-full">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300",
            iconBgClass[variant]
          )}>
            <div className={cn(
              "w-9 h-9 flex items-center justify-center",
              iconColor[variant]
            )}>
              {icon}
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 mt-3 w-full text-center">{title}</h3>
        <p className="text-white text-opacity-90 text-sm mb-4 leading-relaxed w-full text-center">{description}</p>
        <div className="mt-4 w-full">
          <Link href={href}>
            <button className={cn(
              "relative flex items-center justify-center w-full py-2.5 px-4 rounded-2xl shadow-lg font-bold transition-all duration-300 overflow-hidden",
              buttonClass[variant]
            )}>
              {/* نوار مشکی مات سمت راست */}
              
              {/* نوار مشکی مات سمت چپ */}
              
              <span className="relative z-10 flex items-center">
                <span className="text-sm">{`ورود به بخش ${title.split(' ')[1]}`}</span>
                <ArrowLeft className="mr-2 h-4 w-4" />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
