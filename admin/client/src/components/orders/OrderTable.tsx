import { FC } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderTableProps {
  items: {
    menuItemId: number;
    menuItemName: string;
    price: number;
    quantity: number;
    totalPrice: number;
  }[];
  orderNumber?: string;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
}

const OrderTable: FC<OrderTableProps> = ({
  items,
  orderNumber,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-md shadow-lg" dir="rtl">
      <div className="p-2 sm:p-3 border-b border-gray-700 bg-gray-800/80 rounded-t-md">
        <div className="flex justify-between items-center">
          <div className="text-sm font-semibold text-indigo-300">سفارش جاری</div>
          {orderNumber && (
            <div className="text-xs font-medium text-indigo-400 px-3 py-1 bg-gray-900/50 rounded-md shadow-inner">
              شماره سفارش: {orderNumber}
            </div>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 px-1 sm:px-2" type="always">
        <div className="min-w-[480px]">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
              <TableRow className="border-b border-gray-700">
                <TableHead className="w-[8%] p-2 sm:p-3 text-center"></TableHead>
                <TableHead className="w-[18%] p-2 sm:p-3 text-center text-indigo-300 font-bold">جمع</TableHead>
                <TableHead className="w-[20%] p-2 sm:p-3 text-center text-indigo-300 font-bold">تعداد</TableHead>
                <TableHead className="w-[16%] p-2 sm:p-3 text-center text-indigo-300 font-bold">قیمت</TableHead>
                <TableHead className="w-[28%] p-2 sm:p-3 text-center text-indigo-300 font-bold">نام محصول</TableHead>
                <TableHead className="w-[10%] p-2 sm:p-3 text-center text-indigo-300 font-bold">ردیف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-5 text-muted-foreground">
                    سفارشی وجود ندارد
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={`${item.menuItemId}-${index}`} className="hover:bg-gray-800/40 transition-colors">
                    <TableCell className="text-center p-2 sm:p-3">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-gray-800/60 rounded-full mx-auto"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-3 font-medium text-teal-300">{formatPrice(item.totalPrice)}</TableCell>
                    <TableCell className="text-center p-2 sm:p-3">
                      <div className="flex items-center justify-center space-x-3 bg-gray-800/50 rounded-full px-2 py-1.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-red-600/80 hover:text-white focus-visible:ring-1 focus-visible:ring-offset-1 transition-colors"
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-green-600/80 hover:text-white focus-visible:ring-1 focus-visible:ring-offset-1 transition-colors"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-3 text-gray-300">{formatPrice(item.price)}</TableCell>
                    <TableCell className="font-medium p-2 sm:p-3 text-center">{item.menuItemName}</TableCell>
                    <TableCell className="text-center p-2 sm:p-3 font-bold text-indigo-300/80">{index + 1}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-10">
          هیچ محصولی به سفارش اضافه نشده است
        </div>
      )}
    </div>
  );
};

export default OrderTable;
