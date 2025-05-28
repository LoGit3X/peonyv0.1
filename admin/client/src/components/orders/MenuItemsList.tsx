import { FC } from 'react';
import { Recipe } from '@/lib/types';
import { formatPrice, getCategoryColor } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuItemsListProps {
  recipes: Recipe[];
  isLoading: boolean;
  onAddItem: (recipe: Recipe) => void;
  onRemoveItem?: (recipe: Recipe) => void;
}

const MenuItemsList: FC<MenuItemsListProps> = ({
  recipes,
  isLoading,
  onAddItem,
  onRemoveItem,
}) => {
  // حذف reverse تا ترتیب درست باشد
  // const reversedRecipes = [...recipes].reverse();
  
  return (
    <div className="h-full bg-gradient-to-br from-gray-900/70 to-gray-800/90" dir="rtl">
      <ScrollArea className="h-full">
        <div className="p-1">
          {isLoading ? (
            <div className="text-center py-1 text-gray-400 text-xs">در حال بارگذاری منو...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-1 text-gray-400 text-xs">
              هیچ محصولی در این دسته‌بندی یافت نشد
            </div>
          ) : (
            <div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
              style={{ direction: 'rtl' }}
            >
              {recipes.map(recipe => {
                const { gradient, borderColor, textColor } = getCategoryColor(recipe.category || '');
                return (
                  <button
                    key={recipe.id}
                    className={
                      `group relative rounded-2xl p-3 flex flex-col items-center justify-center shadow-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 ` +
                      `hover:scale-105 hover:shadow-2xl hover:border-primary/80 active:scale-100 bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md`
                    }
                    style={{ borderColor: borderColor.replace('border-', '') }}
                    onClick={() => onAddItem(recipe)}
                  >
                    <div className="flex flex-col gap-1 items-center z-10">
                      <h3 className="font-extrabold text-[13px] text-white drop-shadow-lg text-center line-clamp-1 tracking-tight">
                        {recipe.name}
                      </h3>
                      <span className="text-[11px] font-bold text-white bg-transparent px-2 py-0.5 rounded-full shadow-inner border border-white/20">
                        {formatPrice(recipe.finalPrice ?? 0)}
                      </span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl pointer-events-none group-hover:bg-white/10 group-hover:backdrop-blur-sm transition-all duration-200" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MenuItemsList;
