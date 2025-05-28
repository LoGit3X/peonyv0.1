import { FC, useState } from 'react';
import { Calculator, Search, Check, CopyIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Recipe {
  id: number;
  name: string;
  category: string;
  ingredients: {
    materialId: number;
    amount: number;
    material: {
      price: number;
    };
  }[];
  rawPrice: number;
  basePrice: number;
  finalPrice: number;
}

const Prices: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);
  const { toast } = useToast();

  // دریافت لیست رسپی‌ها با مواد اولیه و قیمت‌ها
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes-with-prices'],
    queryFn: async () => {
      const res = await fetch('/api/recipes?include=ingredients');
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    }
  });

  // Filter recipes based on search query
  const filteredRecipes = recipes?.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyPrice = async (price: number) => {
    try {
      await navigator.clipboard.writeText(price.toString());
      setCopiedPrice(price);
      toast({
        title: "قیمت کپی شد",
        description: `${price.toLocaleString('en-US')} تومان در کلیپ‌بورد قرار گرفت`,
        duration: 2000,
      });
      setTimeout(() => setCopiedPrice(null), 2000);
    } catch (err) {
      toast({
        title: "خطا در کپی کردن",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  const formatPriceEnglish = (price: number) => {
    return price.toLocaleString('en-US') + ' تومان';
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 flex justify-end">
          <div className="relative">
            <Input
              type="text"
              placeholder="جستجو در محصولات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-[#23272A] border-gray-700 text-white placeholder-gray-400 pr-10 pl-32 h-8 rounded-lg text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Button 
              variant="default" 
              className="absolute left-0 top-0 h-8 px-3 bg-[#5865F2] hover:bg-blue-600 text-white rounded-r-none text-sm"
              onClick={() => setSearchQuery(searchQuery)}
            >
              جستجو
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border shadow-lg overflow-hidden">
        <style>{`
        .custom-table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }
        .custom-table thead tr th {
          background: linear-gradient(90deg, #6366f1 0%, #23272a 100%);
          color: #fff;
          font-weight: 800;
          font-size: 1.08rem;
          border-top-right-radius: 0.7rem;
          border-top-left-radius: 0.7rem;
          box-shadow: 0 2px 6px 0 rgba(99,102,241,0.08);
          letter-spacing: 0.02em;
          padding-top: 1.1rem;
          padding-bottom: 1.1rem;
        }
        .custom-table tbody tr:nth-child(even) {
          background-color: #23272a;
        }
        .custom-table tbody tr:nth-child(odd) {
          background-color: #202225;
        }
        .custom-table tbody tr {
          transition: background 0.22s, box-shadow 0.18s;
        }
        .custom-table tbody tr:hover {
          background-color: #36393f;
          box-shadow: 0 2px 12px 0 rgba(99,102,241,0.10);
        }
        .custom-table td, .custom-table th {
          border-bottom: 1px solid #36393f !important;
          padding: 0.9rem 0.8rem;
        }
        .custom-table .action-cell {
          text-align: center !important;
        }
        .custom-table .price-copy-btn {
          border-radius: 0.6rem;
          margin: 0 0.22rem;
          font-size: 1rem;
          box-shadow: 0 1px 4px 0 rgba(99,102,241,0.07);
          transition: background 0.18s, color 0.18s, box-shadow 0.16s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.45rem 0.65rem;
        }
        .custom-table .price-copy-btn:hover {
          background: #5865f2;
          color: #fff;
          box-shadow: 0 2px 8px 0 rgba(99,102,241,0.18);
        }
        .clickable-price {
          cursor: pointer;
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .clickable-price:hover {
          background-color: rgba(99, 102, 241, 0.1);
          box-shadow: 0 1px 4px rgba(99, 102, 241, 0.2);
          transform: translateY(-1px);
        }
        .clickable-price:hover .copy-icon {
          opacity: 1;
        }
        .copy-icon {
          opacity: 0;
          width: 14px;
          height: 14px;
          margin-right: 6px;
          transition: opacity 0.2s ease;
        }
        .price-copied-message {
          font-size: 0.7rem;
          color: #10b981;
          margin-right: 4px;
          position: absolute;
          left: 50%;
          bottom: -15px;
          transform: translateX(-50%);
          background-color: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          animation: fadeInOut 2s ease;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        `}</style>
        <Table className="custom-table">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نام محصول</TableHead>
              <TableHead className="text-right">دسته بندی</TableHead>
              <TableHead className="text-center relative group">
                قیمت مواد اولیه
                <span className="hidden group-hover:block absolute top-full right-0 bg-gray-800 text-white text-xs p-2 rounded z-10 w-44">
                  مجموع قیمت مواد اولیه
                </span>
              </TableHead>
              <TableHead className="text-center relative group">
                قیمت پایه
                <span className="hidden group-hover:block absolute top-full right-0 bg-gray-800 text-white text-xs p-2 rounded z-10 w-52">
                  قیمت مواد اولیه × ضریب قیمت
                </span>
              </TableHead>
              <TableHead className="text-center relative group">
                قیمت نهایی
                <span className="hidden group-hover:block absolute top-full right-0 bg-gray-800 text-white text-xs p-2 rounded z-10 w-44">
                  قیمت پایه + 9٪
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <span>در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRecipes && filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <TableRow 
                  key={recipe.id}
                >
                  <TableCell className="text-right font-bold text-base">{recipe.name}</TableCell>
                  <TableCell className="text-right font-bold text-sm">{recipe.category}</TableCell>
                  <TableCell className="text-center">
                    <div 
                      onClick={() => handleCopyPrice(recipe.rawPrice)}
                      className="text-gray-400 font-mono text-sm font-bold hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <span className="clickable-price">
                        <CopyIcon className="copy-icon" size={14} />
                        {formatPriceEnglish(recipe.rawPrice)}
                        {copiedPrice === recipe.rawPrice && <span className="price-copied-message">کپی شد ✓</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div 
                      onClick={() => handleCopyPrice(recipe.basePrice)}
                      className="text-blue-400 font-mono text-sm font-bold hover:text-blue-300 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <span className="clickable-price">
                        <CopyIcon className="copy-icon" size={14} />
                        {formatPriceEnglish(recipe.basePrice)}
                        {copiedPrice === recipe.basePrice && <span className="price-copied-message">کپی شد ✓</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div 
                      onClick={() => handleCopyPrice(recipe.finalPrice)}
                      className="text-green-400 font-mono text-sm font-bold hover:text-green-300 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <span className="clickable-price">
                        <CopyIcon className="copy-icon" size={14} />
                        {formatPriceEnglish(recipe.finalPrice)}
                        {copiedPrice === recipe.finalPrice && <span className="price-copied-message">کپی شد ✓</span>}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-400">
                  {searchQuery ? 'هیچ محصولی با این نام یافت نشد' : 'هیچ رسپی‌ای یافت نشد'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Prices; 