import { FC, useState, useEffect } from 'react';
import { Warehouse } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import InventoryTable from '@/components/inventory/InventoryTable';

const Inventory: FC = () => {
  const { toast } = useToast();

  // Force refetch materials when the component mounts
  useEffect(() => {
    console.log('Inventory page loaded, forcing refetch...');
    
    // Invalidate and refetch the materials query
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    
    // You could also manually fetch data to check for errors
    fetch('/api/materials')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`Direct fetch: received ${data.length} materials`);
      })
      .catch(err => {
        console.error('Direct fetch error:', err);
        toast({
          title: 'خطا در بارگیری داده‌ها',
          description: err.message,
          variant: 'destructive',
        });
      });
  }, []);

  return (
    <div className="container mx-auto p-6 bg-[#2C2F33] rounded-lg shadow">
      <InventoryTable />
    </div>
  );
};

export default Inventory;
