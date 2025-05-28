import { FC } from 'react';
import { formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown, Package, Utensils, LineChart } from 'lucide-react';
import { Stat } from '@/lib/types';

// تبدیل اعداد لاتین به فارسی
function toPersianDigits(str: string | number) {
  return String(str).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

interface StatCardProps {
  stat: Stat;
}

const StatCard: FC<StatCardProps> = ({ stat }) => {
  const getIcon = () => {
    switch (stat.title) {
      case 'تعداد مواد اولیه':
        return <Package className="text-sky-400 text-xl" />;
      case 'تعداد رسپی‌ها':
        return <Utensils className="text-sky-400 text-xl" />;
      case 'فروش ماهانه':
        return <LineChart className="text-sky-400 text-xl" />;
      default:
        return <Package className="text-sky-400 text-xl" />;
    }
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-lg shine-effect transition-all duration-300 hover:shadow-xl hover:scale-[1.02] p-3 min-h-[56px] border-2 border-transparent bg-clip-padding statcard-glow-border">
      <div className="flex flex-row items-center justify-center text-center w-full h-full gap-4">
        <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center order-1">
          {getIcon()}
        </div>
        <div className="flex flex-row items-baseline justify-center flex-1 gap-2 order-2 text-center">
          <p className="text-sky-300 text-base font-bold text-center">{stat.title}</p>
          <h3 className="text-base font-bold text-white text-center">{typeof stat.value === 'number' ? toPersianDigits(formatNumber(stat.value)) : toPersianDigits(stat.value)}</h3>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
