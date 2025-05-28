import { FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Material } from '@/lib/types';

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'نام ماده اولیه الزامی است'),
  price: z.coerce.number().min(1, 'قیمت باید بزرگتر از صفر باشد'),
  stock: z.coerce.number().min(0, 'موجودی نمی‌تواند منفی باشد'),
});

// Define form values type
type InventoryFormValues = z.infer<typeof formSchema>;

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Material;
}

const InventoryForm: FC<InventoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        price: initialData.price,
        stock: initialData.stock,
      });
    }
  }, [initialData, form]);

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: (data: InventoryFormValues) => {
      console.log('Updating material with data:', data);
      return apiRequest(`/api/materials/${initialData?.id}`, {
        method: 'PUT',
        data
      });
    },
    onSuccess: (response) => {
      console.log('Material updated successfully, response:', response);
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: 'موجودی با موفقیت بروزرسانی شد',
        variant: "success",
        description: 'تغییرات موجودی با موفقیت اعمال شد',
        duration: 3000,
        className: "p-3 text-sm"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'خطا در بروزرسانی موجودی',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: "destructive",
        duration: 5000,
        className: "p-3 text-sm"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Form submission handler
  const onSubmit = async (values: InventoryFormValues) => {
    setIsSubmitting(true);
    
    // If editing existing material
    if (initialData) {
      updateMaterialMutation.mutate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#2C2F33] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center w-full">{initialData ? 'ویرایش موجودی انبار' : 'افزودن موجودی جدید'}</DialogTitle>
          <DialogDescription className="text-gray-400 text-center w-full">
            اطلاعات موجودی ماده اولیه را ویرایش کنید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-1">
  <FormLabel className="text-gray-300">نام ماده اولیه</FormLabel>
  <span className="text-blue-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    {...field}
    disabled={true}
    className="bg-[#23272A] border border-gray-700 text-gray-300 rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200"
  />
</FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-1">
  <FormLabel className="text-gray-300">قیمت (تومان)</FormLabel>
  <span className="text-green-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    {...field}
    disabled={true}
    type="number"
    className="bg-[#23272A] border border-gray-700 text-gray-300 rounded-xl shadow-md focus:ring-2 focus:ring-green-500 placeholder-gray-400 transition-all duration-200"
  />
</FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-1">
  <FormLabel className="text-gray-300">موجودی (گرم)</FormLabel>
  <span className="text-yellow-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    {...field}
    type="number"
    className="bg-[#23272A] border border-gray-700 text-white rounded-xl shadow-md focus:ring-2 focus:ring-yellow-500 placeholder-gray-400 transition-all duration-200"
  />
</FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="flex justify-center gap-2 pt-6">
  <Button
    type="button"
    variant="outline"
    onClick={() => onOpenChange(false)}
    className="border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg px-5 py-2 transition-all shadow-sm"
  >
    انصراف
  </Button>
  <Button
    type="submit"
    disabled={isSubmitting}
    className="bg-[#5865F2] hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-bold shadow-md transition-all disabled:opacity-60"
  >
    {isSubmitting ? (
      <>
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        در حال ذخیره...
      </>
    ) : (
      'ذخیره تغییرات'
    )}
  </Button>
</div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryForm;
