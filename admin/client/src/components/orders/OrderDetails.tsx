import { FC, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Order, OrderItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Printer, Check, AlertTriangle, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Receipt } from '@/lib/types';
import { printer } from '@/lib/printer';

interface OrderDetailsProps {
  order: Partial<Order>;
}

const OrderDetails: FC<OrderDetailsProps> = ({ order }): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentStatus, setPaymentStatus] = useState<boolean>(order.isPaid ?? false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(order.paymentMethod || 'نقد');
  const [orderStatus, setOrderStatus] = useState<string>(order.status || 'pending');

  // اگر اطلاعات سفارش ناقص بود، آن را از سرور بگیر
  const { data: fullOrder, isLoading: isOrderLoading } = useQuery({
    queryKey: ['/api/orders', order.id],
    queryFn: async () => {
      if (!order.id) throw new Error('شناسه سفارش نامشخص است');
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات سفارش');
      return res.json() as Promise<Order>;
    },
    enabled: !order.orderNumber && !!order.id,
    // فقط اگر اطلاعات سفارش ناقص است و id داریم، اجرا شود
  });

  // استفاده از اطلاعات کامل سفارش اگر وجود داشت
  const currentOrder = fullOrder || order;

  // Fetch order items
  const { data: orderItems, isLoading } = useQuery({
    queryKey: ['/api/order-items', currentOrder.id],
    queryFn: async () => {
      const res = await fetch(`/api/order-items?orderId=${currentOrder.id}`);
      if (!res.ok) throw new Error('Failed to fetch order items');
      return res.json() as Promise<OrderItem[]>;
    },
    enabled: !!currentOrder.id,
  });

  useEffect(() => {
    if (currentOrder.isPaid !== undefined) setPaymentStatus(currentOrder.isPaid);
    if (currentOrder.paymentMethod) setPaymentMethod(currentOrder.paymentMethod);
    if (currentOrder.status) setOrderStatus(currentOrder.status);
  }, [currentOrder.isPaid, currentOrder.paymentMethod, currentOrder.status]);

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/orders/${currentOrder.id}`, {
        method: 'PUT',
        data: {
          isPaid: paymentStatus,
          paymentMethod: paymentMethod,
          status: orderStatus,
          totalAmount: currentOrder.totalAmount,
          jalaliDate: currentOrder.jalaliDate,
          jalaliTime: currentOrder.jalaliTime,
          orderNumber: currentOrder.orderNumber,
          customerName: currentOrder.customerName,
          notes: currentOrder.notes
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'سفارش با موفقیت به‌روزرسانی شد',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast({
        title: 'خطا در به‌روزرسانی سفارش',
        description: error.message,
        variant: 'warning',
      });
    }
  });

  // Print receipt for POS printer (79mm width)
  const printReceipt = async () => {
    try {
      const receipt: Receipt = {
        orderNumber: currentOrder.orderNumber || '',
        date: currentOrder.jalaliDate || '',
        time: currentOrder.jalaliTime || '',
        items: orderItems?.map(item => ({
          name: item.menuItemName,
          quantity: item.quantity,
          price: item.price || 0,
          total: item.totalPrice || 0
        })) || [],
        total: currentOrder.totalAmount || 0,
        customerName: currentOrder.customerName,
        paymentMethod: currentOrder.paymentMethod,
        cafeName: 'کافه پیونی'
      };

      await printer.printReceipt(receipt);
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: 'خطا در چاپ',
        description: error?.message || 'خطای ناشناخته در چاپ فاکتور',
        variant: 'destructive',
      });
    }
  };

  // Handle status update
  const handleUpdateOrder = () => {
    updateOrderMutation.mutate();
  };

  return (
    <div className="space-y-3 md:space-y-4" dir="rtl" style={{fontFamily:'Vazirmatn, IRANSans, Tahoma, Arial, sans-serif'}}>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr] gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg text-center">اقلام سفارش</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {isLoading ? (
              <div className="text-center py-2 text-sm">در حال بارگذاری اقلام سفارش...</div>
            ) : !orderItems || orderItems.length === 0 ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                هیچ آیتمی برای این سفارش یافت نشد
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center text-indigo-300 font-bold text-sm">ردیف</TableHead>
                    <TableHead className="text-right text-indigo-300 font-bold text-sm">نام محصول</TableHead>
                    <TableHead className="w-[100px] text-center text-indigo-300 font-bold text-sm">قیمت واحد</TableHead>
                    <TableHead className="w-[60px] text-center text-indigo-300 font-bold text-sm">تعداد</TableHead>
                    <TableHead className="w-[100px] text-center text-indigo-300 font-bold text-sm">قیمت کل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item, index) => (
                    <TableRow key={item.id} className="text-sm">
                      <TableCell className="text-center px-1 py-2">{index + 1}</TableCell>
                      <TableCell className="text-right px-1 py-2 font-medium">{item.menuItemName}</TableCell>
                      <TableCell className="text-center px-1 py-2">{formatPrice(item.price ?? 0)}</TableCell>
                      <TableCell className="text-center px-1 py-2">{item.quantity}</TableCell>
                      <TableCell className="text-center px-1 py-2">{formatPrice(item.totalPrice ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-left font-bold text-sm">جمع کل:</TableCell>
                    <TableCell className="text-center font-bold text-sm">{formatPrice(currentOrder.totalAmount ?? 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg text-center">وضعیت سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">وضعیت پرداخت</Label>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={paymentStatus}
                    onCheckedChange={setPaymentStatus}
                  />
                  <span className="text-xs text-muted-foreground">
                    {paymentStatus ? 'پرداخت شده' : 'پرداخت نشده'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 py-1">
                <div className="text-center">
                  <Label className="text-xs mb-1.5 block">روش پرداخت</Label>
                  <Select
                    value={paymentMethod || ''}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="text-xs h-9 justify-center">
                      <SelectValue placeholder="انتخاب روش پرداخت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقد" className="text-center">نقد</SelectItem>
                      <SelectItem value="کارت" className="text-center">کارت بانکی</SelectItem>
                      <SelectItem value="آنلاین" className="text-center">پرداخت آنلاین</SelectItem>
                      <SelectItem value="اعتباری" className="text-center">حساب اعتباری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-center">
                  <Label className="text-xs mb-1.5 block">وضعیت سفارش</Label>
                  <Select
                    value={orderStatus}
                    onValueChange={setOrderStatus}
                  >
                    <SelectTrigger className="text-xs h-9 justify-center">
                      <SelectValue placeholder="انتخاب وضعیت سفارش" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-amber-500 text-center">در انتظار</SelectItem>
                      <SelectItem value="completed" className="text-green-500 text-center">تکمیل شده</SelectItem>
                      <SelectItem value="cancelled" className="text-red-500 text-center">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleUpdateOrder} 
                  disabled={updateOrderMutation.isPending}
                  className="w-full h-9 text-xs"
                >
                  {updateOrderMutation.isPending ? 'در حال ذخیره...' : 'به‌روزرسانی وضعیت'}
                </Button>
              </div>
              
              <div className="flex flex-row-reverse justify-between items-center gap-2 mt-3 pt-3 border-t">
                <div className="flex flex-row-reverse items-center gap-1">
                  <Badge variant={
                    currentOrder.status === 'completed' ? 'success' :
                    currentOrder.status === 'pending' ? 'warning' : 'destructive'
                  } className="text-xs px-2 py-1">
                    {currentOrder.status === 'completed' ? (
                      <Check className="h-3 w-3 ml-1" />
                    ) : currentOrder.status === 'pending' ? (
                      <AlertTriangle className="h-3 w-3 ml-1" />
                    ) : (
                      <X className="h-3 w-3 ml-1" />
                    )}
                    {currentOrder.status === 'completed' ? 'تکمیل شده' :
                     currentOrder.status === 'pending' ? 'در انتظار' : 'لغو شده'}
                  </Badge>
                  <Badge variant={currentOrder.isPaid ? 'success' : 'outline'} className="text-xs px-2 py-1">
                    {currentOrder.isPaid ? 'پرداخت شده' : 'پرداخت نشده'}
                  </Badge>
                </div>
                
                <Button variant="outline" onClick={printReceipt} className="h-8 text-xs px-2">
                  <Printer className="h-4 w-4 ml-1" />
                  چاپ فاکتور
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-base text-center">اطلاعات سفارش</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">شماره سفارش:</Label>
                  <span className="text-xs font-medium">{currentOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs">تاریخ و زمان:</Label>
                  <span className="text-xs font-medium">{currentOrder.jalaliDate} - {currentOrder.jalaliTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs">نام مشتری:</Label>
                  <span className="text-xs font-medium">{currentOrder.customerName || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs">مبلغ کل:</Label>
                  <span className="text-xs font-medium text-teal-700">{formatPrice(currentOrder.totalAmount ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;