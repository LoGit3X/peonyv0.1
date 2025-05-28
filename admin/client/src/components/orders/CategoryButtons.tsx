import { FC } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PiBowlFoodFill,
  PiCoffeeFill,
  PiCoffee,
  PiWineLight,
  PiDropFill,
  PiIceCreamLight,
  PiWineFill
} from "react-icons/pi";

interface CategoryButtonsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CategoryButtons: FC<CategoryButtonsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  // Create a reversed copy of categories to display from right to left
  const reversedCategories = [...categories].reverse();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ice Coffee':
        return <PiCoffeeFill />;
      case 'Ice Bar':
        return <PiIceCreamLight />;
      case 'Smoothie':
        return <PiDropFill />;
      case 'Hot Coffee':
        return <PiCoffee />;
      case 'Hot Bar':
        return <PiWineLight />;
      case 'Shake':
        return <PiDropFill />;
      case 'Mocktail':
        return <PiWineFill />;
      default:
        return <PiBowlFoodFill />;
    }
  };

  return (
    <div className="w-full bg-gray-800/80 rounded-xl shadow-inner py-2 px-3">
      <ScrollArea className="w-full">
        <div 
          className="flex gap-2.5 items-center p-1 rtl"
          style={{ direction: 'rtl' }}
        >
          <button
            className={`
              group flex items-center justify-center gap-2
              w-[110px] h-[38px]
              rounded-xl font-bold text-xs
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 focus:ring-offset-2 focus:ring-offset-gray-800
              ${selectedCategory === null
                ? 'bg-[#5865F2] text-white border-none shadow-[0_0_8px_rgba(88,101,242,0.4)]'
                : 'bg-gray-700/80 text-gray-200 border border-gray-600/50 hover:bg-gray-600 hover:text-white'
              }
            `}
            onClick={() => onSelectCategory(null)}
            aria-pressed={selectedCategory === null}
          >
            <span className="text-lg group-hover:opacity-100 transition-opacity">
              <PiBowlFoodFill />
            </span>
            <span>همه</span>
          </button>

          {reversedCategories.map((category) => (
            <button
              key={category}
              className={`
                group flex items-center justify-center gap-2
                w-[110px] h-[38px]
                rounded-xl font-bold text-xs
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 focus:ring-offset-2 focus:ring-offset-gray-800
                ${selectedCategory === category
                  ? 'bg-[#5865F2] text-white border-none shadow-[0_0_8px_rgba(88,101,242,0.4)]'
                  : 'bg-gray-700/80 text-gray-200 border border-gray-600/50 hover:bg-gray-600 hover:text-white'
                }
              `}
              onClick={() => onSelectCategory(category)}
              aria-pressed={selectedCategory === category}
            >
              <span className="text-lg group-hover:opacity-100 transition-opacity">
                {getCategoryIcon(category)}
              </span>
              <span>{category}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CategoryButtons;
