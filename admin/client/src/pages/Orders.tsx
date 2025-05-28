import { FC, useState } from 'react';
import { Route, useRoute } from 'wouter';
import OrderManagement from '@/components/orders/OrderManagement';
import OrdersList from '@/components/orders/OrdersList';
import OrderDetails from '@/components/orders/OrderDetails';
import { Button } from '@/components/ui/button';

// CSS برای نوشتن عمودی
const writingModeVertical = {
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)'
};

const OrdersPage: FC = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [match, params] = useRoute('/orders/:orderId');
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex">
        {!match && (
          <div className="w-11 bg-gray-800 border-l border-gray-700 flex flex-col items-center py-4 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              className={`mb-5 w-10 h-16 px-1 py-2 flex flex-col items-center justify-center rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 focus:ring-offset-1 focus:ring-offset-gray-800 z-10 ${
                activeTab === 'new' 
                  ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[0_0_8px_rgba(88,101,242,0.4)]' 
                  : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
              }`}
              onClick={() => setActiveTab('new')}
            >
              <span className="text-[10px] whitespace-nowrap font-semibold" style={writingModeVertical}>سفارش جدید</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`w-10 h-16 px-1 py-2 flex flex-col items-center justify-center rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 focus:ring-offset-1 focus:ring-offset-gray-800 z-10 ${
                activeTab === 'list' 
                  ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-[0_0_8px_rgba(88,101,242,0.4)]' 
                  : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
              }`}
              onClick={() => setActiveTab('list')}
            >
              <span className="text-[10px] whitespace-nowrap font-semibold" style={writingModeVertical}>لیست سفارشات</span>
            </Button>
          </div>
        )}

        <div className="flex-1">
          {match ? (
            <OrderDetails order={{ id: Number(params?.orderId) } as any} />
          ) : (
            activeTab === 'new' ? <OrderManagement /> : <OrdersList />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;