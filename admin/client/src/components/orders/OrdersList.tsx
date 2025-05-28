import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatPrice, getJalaliDate } from '@/lib/utils';
import { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, X, Eye, Printer } from 'lucide-react';
import { Link } from 'wouter';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrdersListProps {
  statusFilter?: 'all' | 'pending' | 'completed' | 'cancelled';
}

const OrdersList: FC<OrdersListProps> = ({ statusFilter = 'all' }) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/api/orders' 
        : `/api/orders?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json() as Promise<Order[]>;
    }
  });

  return (
    <div className="h-full flex flex-col bg-gray-900/30 rounded-md shadow-xl" dir="rtl">
      <div className="p-3 border-b border-gray-700 bg-gray-800/80 rounded-t-md shadow-sm flex justify-between items-center">
        <div className="text-md font-semibold text-indigo-300">لیست سفارش‌ها</div>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
            <TableRow className="border-b-2 border-gray-700">
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">عملیات</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">وضعیت سفارش</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">وضعیت پرداخت</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">مبلغ کل</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">مشتری</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">تاریخ</TableHead>
              <TableHead className="text-right p-3 text-sm text-indigo-300 font-bold">شماره سفارش</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-400 text-sm">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-800/40 transition-colors border-b border-gray-800/80">
                  <TableCell className="text-right p-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-gray-700"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <Eye className="h-4 w-4 text-indigo-300" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right p-3">
                    <Badge variant={
                      order.status === 'completed' ? "success" :
                      order.status === 'cancelled' ? "destructive" :
                      "warning"
                    } className="text-xs px-2 py-0.5 rounded-full">
                      {order.status === 'completed' ? 'تکمیل شده' :
                       order.status === 'cancelled' ? 'لغو شده' :
                       'در انتظار'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-3">
                    <Badge variant={order.isPaid ? "success" : "outline"} className="text-xs px-2 py-0.5 rounded-full">
                      {order.isPaid ? 'پرداخت شده' : 'پرداخت نشده'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-3 text-teal-300 font-medium" dir="ltr">{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell className="text-right p-3 text-gray-300">{order.customerName || '-'}</TableCell>
                  <TableCell className="text-right p-3 text-gray-300" dir="ltr">{order.jalaliDate} - {order.jalaliTime}</TableCell>
                  <TableCell className="text-right p-3 text-gray-300 font-mono" dir="ltr">{order.orderNumber}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                  هیچ سفارشی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default OrdersList;