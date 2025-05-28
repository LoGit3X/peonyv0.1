import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, getJalaliDate, generateOrderNumber } from '@/lib/utils';
import { MenuItem, OrderFormValues } from '@/lib/types';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Order form schema
const orderFormSchema = z.object({
  customerName: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.number(),
      menuItemName: z.string(),
      price: z.number(),
      quantity: z.number().min(1, { message: 'حداقل تعداد ۱ می‌باشد' }),
      totalPrice: z.number(),
    })
  ).min(1, { message: 'حداقل یک آیتم باید اضافه شود' }),
  paymentMethod: z.string().optional(),
  isPaid: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof orderFormSchema>;

interface NewOrderFormProps {
  onSuccess: () => void;
}

const NewOrderForm: FC<NewOrderFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    queryFn: async () => {
      const res = await fetch('/api/menu-items');
      if (!res.ok) throw new Error('Failed to fetch menu items');
      return res.json() as Promise<MenuItem[]>;
    }
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: '',
      items: [],
      paymentMethod: 'نقد',
      isPaid: false,
      notes: '',
    },
  });

  // Watch items to calculate total
  const items = form.watch('items');
  const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      // Current Persian date and time with Latin numerals
      const now = new Date();
      const orderDate = getJalaliDate(); // e.g. "1402/01/15" but with Latin numerals
      const orderTime = now.toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit',
        numberingSystem: 'latn' 
      }); // e.g. "14:30" with Latin numerals
      
      // Create order number using the generate function
      const orderNumber = generateOrderNumber();
      
      // Create the order
      const orderResponse = await apiRequest('/api/orders', {
        method: 'POST',
        data: {
          orderNumber,
          customerName: data.customerName || null,
          totalAmount,
          isPaid: data.isPaid,
          paymentMethod: data.paymentMethod || null,
          status: 'pending',
          notes: data.notes || null,
          jalaliDate: orderDate,
          jalaliTime: orderTime,
        }
      });
      
      // Add order items
      await Promise.all(data.items.map(item => 
        apiRequest('/api/order-items', {
          method: 'POST',
          data: {
            orderId: orderResponse.id,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            price: item.price, 
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          }
        })
      ));
      
      return orderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'سفارش با موفقیت ثبت شد',
        variant: 'success',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'خطا در ثبت سفارش',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Add item to order
  const addItemToOrder = () => {
    if (!selectedMenuItem) return;
    
    const totalPrice = selectedMenuItem.price * quantity;
    
    // Check if item already exists
    const existingItemIndex = items.findIndex(item => item.menuItemId === selectedMenuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newItems = [...items];
      const newQuantity = newItems[existingItemIndex].quantity + quantity;
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newQuantity,
        totalPrice: selectedMenuItem.price * newQuantity,
      };
      form.setValue('items', newItems);
    } else {
      // Add new item
      form.setValue('items', [
        ...items,
        {
          menuItemId: selectedMenuItem.id,
          menuItemName: selectedMenuItem.name,
          price: selectedMenuItem.price,
          quantity,
          totalPrice,
        }
      ]);
    }
    
    // Reset selection
    setSelectedMenuItem(null);
    setQuantity(1);
  };

  // Remove item from order
  const removeItem = (index: number) => {
    form.setValue('items', items.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createOrderMutation.mutate(data);
  };

  // Categories for grouping menu items
  const categories = menuItems ? 
    menuItems
      .map(item => item.category)
      .filter((category, index, self) => self.indexOf(category) === index) 
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام مشتری</FormLabel>
                  <FormControl>
                    <Input placeholder="نام مشتری (اختیاری)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>روش پرداخت</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب روش پرداخت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="نقد">نقد</SelectItem>
                      <SelectItem value="کارت">کارت بانکی</SelectItem>
                      <SelectItem value="آنلاین">پرداخت آنلاین</SelectItem>
                      <SelectItem value="اعتباری">حساب اعتباری</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">وضعیت پرداخت</FormLabel>
                    <FormDescription>
                      آیا هزینه سفارش پرداخت شده است؟
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت یا توضیحات تکمیلی"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Menu Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>افزودن آیتم</CardTitle>
                <CardDescription>
                  محصول مورد نظر را از منو انتخاب کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                {menuItemsLoading ? (
                  <div className="text-center py-4">در حال بارگذاری منو...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormLabel>دسته‌بندی و محصول</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const item = menuItems?.find(item => item.id === parseInt(value));
                            setSelectedMenuItem(item || null);
                          }}
                          value={selectedMenuItem ? selectedMenuItem.id.toString() : ''}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب محصول" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <div key={category}>
                                <h3 className="font-semibold text-sm bg-muted/50 px-2 py-1">
                                  {category}
                                </h3>
                                {menuItems
                                  ?.filter(item => item.category === category && item.isActive)
                                  .map(item => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.name} - {formatPrice(item.price)}
                                    </SelectItem>
                                  ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FormLabel>تعداد</FormLabel>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Button
                            type="button"
                            onClick={addItemToOrder}
                            disabled={!selectedMenuItem}
                            className="mr-2"
                            size="sm"
                          >
                            <PlusCircle className="h-4 w-4 ml-1" />
                            افزودن
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold mb-2">اقلام سفارش</h3>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">عملیات</TableHead>
                  <TableHead className="text-right">قیمت کل (تومان)</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">قیمت واحد (تومان)</TableHead>
                  <TableHead className="text-right">نام محصول</TableHead>
                  <TableHead className="w-[50px] text-right">ردیف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.menuItemId}-${index}`}>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(item.totalPrice)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                    <TableCell className="text-right">{item.menuItemName}</TableCell>
                    <TableCell className="text-right">{index + 1}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold">
                    {formatPrice(totalAmount)}
                  </TableCell>
                  <TableCell colSpan={4} className="text-left font-bold">
                    جمع کل:
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 border rounded-md bg-muted/50">
              هیچ محصولی به سفارش اضافه نشده است
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            className="ml-2"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={createOrderMutation.isPending || items.length === 0}
          >
            {createOrderMutation.isPending ? 'در حال ثبت...' : 'ثبت سفارش'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewOrderForm;