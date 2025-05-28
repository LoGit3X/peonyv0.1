import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatPrice, getJalaliDate, generateOrderNumber } from '@/lib/utils';
import { Recipe, OrderItem } from '@/lib/types';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CategoryButtons from './CategoryButtons';
import MenuItemsList from './MenuItemsList';
import OrderTable from './OrderTable';

interface OrderManagementProps {}

const OrderManagement: FC<OrderManagementProps> = () => {
  // State for the current order
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{
    menuItemId: number;
    menuItemName: string;
    price: number;
    quantity: number;
    totalPrice: number;
  }[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Fetch recipes
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['/api/recipes'],
    queryFn: async () => {
      const res = await fetch('/api/recipes?include=ingredients');
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json() as Promise<Recipe[]>;
    }
  });

  // Generate categories from recipes
  const availableCategories = recipes
    ? [...new Set(recipes.map(recipe => recipe.category))]
    : [];
    
  // Set categories in the specific order requested
  const orderedCategoryNames = [
    "Ice Coffee",
    "Ice Bar",
    "Smoothie",
    "Hot Coffee",
    "Hot Bar",
    "Shake",
    "Mocktail"
  ];
  
  // Filter orderedCategoryNames to only include categories that exist in the data
  const categories = orderedCategoryNames.filter(cat => 
    availableCategories.includes(cat)
  );

  // Filter recipes by selected category
  const filteredRecipes = recipes
    ? selectedCategory
      ? recipes.filter(recipe => recipe.category === selectedCategory)
      : [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
    : [];

  // Update total amount when order items change
  useEffect(() => {
    const total = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(total);
  }, [orderItems]);

  // Generate order number and date on component mount
  useEffect(() => {
    const now = new Date();
    setOrderNumber(generateOrderNumber());
    setCurrentDate(getJalaliDate());
    setCurrentTime(now.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      numberingSystem: 'latn'
    }));
  }, []);

  // Add recipe to order
  const addItemToOrder = (recipe: Recipe) => {
    const existingItemIndex = orderItems.findIndex(
      orderItem => orderItem.menuItemId === recipe.id
    );

    if (existingItemIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + 1,
        totalPrice: recipe.finalPrice * (newItems[existingItemIndex].quantity + 1),
      };
      setOrderItems(newItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          menuItemId: recipe.id,
          menuItemName: recipe.name,
          price: recipe.finalPrice,
          quantity: 1,
          totalPrice: recipe.finalPrice,
        },
      ]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      quantity: newQuantity,
      totalPrice: newItems[index].price * newQuantity,
    };
    setOrderItems(newItems);
  };

  // Remove item from order
  const removeItemFromOrder = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Cancel order
  const cancelOrder = () => {
    setOrderItems([]);
  };

  // Submit order
  const submitOrder = async () => {
    if (orderItems.length === 0) {
      alert('لطفا حداقل یک محصول به سفارش اضافه کنید');
      return;
    }

    try {
      // Current Persian date and time with Latin numerals
      const orderDate = getJalaliDate();
      const orderTime = new Date().toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit',
        numberingSystem: 'latn'
      });
      
      // Generate a new order number based on current date and time
      const newOrderNumber = generateOrderNumber();

      // Create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: newOrderNumber,
          totalAmount,
          isPaid: false,
          status: 'pending',
          jalaliDate: orderDate,
          jalaliTime: orderTime,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || 'خطا در ارتباط با سرور';
        throw new Error(`خطا در ثبت سفارش: ${errorMessage} (کد: ${orderResponse.status})`);
      }

      const order = await orderResponse.json();

      // Add order items
      try {
        await Promise.all(orderItems.map(async (item, index) => {
          const itemResponse = await fetch('/api/order-items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            }),
          });
          
          if (!itemResponse.ok) {
            const errorData = await itemResponse.json().catch(() => ({}));
            throw new Error(`خطا در ثبت آیتم سفارش ${index + 1} (${item.menuItemName}): ${errorData.message || 'دلیل نامشخص'}`);
          }
        }));
      } catch (itemError) {
        // In case of item error, we still created the order, so provide a detailed message
        console.error('Error adding order items:', itemError);
        alert(itemError.message || 'خطا در ثبت آیتم‌های سفارش');
        // Continue with success flow since the main order was created
        setOrderItems([]);
        setOrderNumber(generateOrderNumber());
        return;
      }

      // Reset order
      setOrderItems([]);

      // Generate new order number for next order
      setOrderNumber(generateOrderNumber());

      alert('سفارش با موفقیت ثبت شد');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(error.message || 'خطا در ثبت سفارش');
    }
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Category buttons */}
      <div className="p-2 sm:p-3 border-b border-gray-700 bg-gray-800/80 shadow-md">
        <div className="flex-1 min-w-0">
          <CategoryButtons
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-gray-900/30">
        {/* Recipes list */}
        <div className="w-full md:w-1/2 lg:w-7/12 xl:w-1/2 md:border-l border-gray-700">
          <MenuItemsList
            recipes={filteredRecipes}
            isLoading={recipesLoading}
            onAddItem={addItemToOrder}
            onRemoveItem={(recipe) => {
              const existingItemIndex = orderItems.findIndex(
                orderItem => orderItem.menuItemId === recipe.id
              );
              if (existingItemIndex >= 0) {
                removeItemFromOrder(existingItemIndex);
              }
            }}
          />
        </div>

        {/* Order items table */}
        <div className="w-full md:w-1/2 lg:w-5/12 xl:w-1/2 max-h-[40vh] md:max-h-none border-t md:border-t-0 border-gray-700 md:border-0">
          <OrderTable
            items={orderItems}
            orderNumber={orderNumber}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItemFromOrder}
          />
        </div>
      </div>

      {/* Footer with total and actions */}
      <div className="p-3 sm:p-4 border-t border-gray-700 shadow-md flex flex-wrap justify-between items-center gap-2 bg-gray-800/80">
        <div className="flex gap-3 mx-auto md:mr-auto md:ml-0">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-200 px-5 py-2 rounded-full shadow-sm"
            onClick={cancelOrder}
          >
            انصراف
          </Button>
          <Button 
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full shadow-sm"
            onClick={submitOrder}
          >
            ثبت سفارش
          </Button>
        </div>
        <div className="w-full md:w-auto order-first md:order-last text-lg font-bold text-teal-300 text-center md:text-right md:pr-6">
          {formatPrice(totalAmount)} تومان
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
