import { FC } from 'react';
import { Activity } from '@/lib/types';
import { formatJalaliDateTime } from '@/lib/utils';
import { 
  Plus, 
  Edit, 
  Trash, 
  Calculator,
  ShoppingBag,
  Package,
  Utensils,
  Coffee,
  DollarSign,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  activity: Activity;
}

const ActivityItem: FC<ActivityItemProps> = ({ activity }) => {
  const getActionIcon = () => {
    switch (activity.type) {
      case 'add':
        return <Plus className="text-white text-sm absolute group-hover:scale-110 transition-transform" />;
      case 'edit':
        return <Edit className="text-white text-sm absolute group-hover:scale-110 transition-transform" />;
      case 'delete':
        return <Trash className="text-white text-sm absolute group-hover:scale-110 transition-transform" />;
      case 'calculate':
        return <Calculator className="text-white text-sm absolute group-hover:scale-110 transition-transform" />;
      default:
        return <ShoppingBag className="text-white text-sm absolute group-hover:scale-110 transition-transform" />;
    }
  };

  const getSectionIcon = () => {
    const section = activity.section?.toLowerCase();
    switch (section) {
      case 'materials':
        return <Package className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'recipes':
        return <Utensils className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'menu':
        return <Coffee className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'prices':
        return <DollarSign className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'settings':
        return <Settings className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'users':
        return <Users className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      case 'reports':
        return <FileText className="text-white/80 text-sm absolute -bottom-3 -right-3 scale-75" />;
      default:
        return null;
    }
  };

  const getIconClass = () => {
    switch (activity.type) {
      case 'add':
        return 'from-emerald-500 to-emerald-700';
      case 'edit':
        return 'from-sky-500 to-sky-700';
      case 'delete':
        return 'from-rose-500 to-rose-700';
      case 'calculate':
        return 'from-amber-500 to-amber-700';
      default:
        return 'from-violet-500 to-violet-700';
    }
  };

  return (
    <div className="group flex items-start space-x-4 space-x-reverse bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-2 transition-all duration-300 hover:translate-x-1 hover:shadow-lg border border-white/10">
      <div className={cn(
        "relative w-8 h-8 rounded-lg p-2 shadow-lg group-hover:shadow-xl transition-all duration-300",
        "bg-gradient-to-br",
        getIconClass()
      )}>
        <div className="relative w-full h-full">
          {getActionIcon()}
          {getSectionIcon()}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-white/90 font-medium leading-relaxed">
          {activity.description}
          {activity.entityName && (
            <span className="text-sky-300 font-semibold"> {activity.entityName}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[11px] text-gray-400">
            {formatJalaliDateTime(activity.date)}
          </p>
          {activity.section && (
            <>
              <span className="text-[10px] text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-medium">
                {activity.section}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
