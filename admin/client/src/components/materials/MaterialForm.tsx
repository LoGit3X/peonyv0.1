import { FC, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Material } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

// Material form schema
const materialSchema = z.object({
  name: z.string().min(2, { message: 'نام ماده اولیه حداقل باید ۲ حرف باشد' }),
  price: z.number({ required_error: 'لطفا قیمت را وارد کنید' })
    .min(0, { message: 'قیمت نمی‌تواند منفی باشد' }),
  stock: z.number({ required_error: 'لطفا موجودی را وارد کنید' })
    .min(0, { message: 'موجودی نمی‌تواند منفی باشد' }),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Material;
}

const MaterialForm: FC<MaterialFormProps> = ({
  open,
  onOpenChange,
  initialData,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
    },
  });

  // Ensure form is reset with the correct values when initialData changes
  React.useEffect(() => {
    if (initialData) {
      console.log("Populating form with initial data:", initialData);
      form.reset({
        name: initialData.name,
        price: initialData.price,
        stock: initialData.stock || 0,
      });
    }
  }, [form, initialData]);

  const addMaterialMutation = useMutation({
    mutationFn: (data: MaterialFormValues) =>
      apiRequest('/api/materials', {
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: 'ماده اولیه با موفقیت اضافه شد',
        variant: "success",
        description: 'ماده اولیه جدید با موفقیت به سیستم اضافه شد',
        duration: 3000,
        className: "p-3 text-sm"
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'خطا در افزودن ماده اولیه',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: "error",
        duration: 4000,
        className: "p-3 text-sm"
      });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: (data: MaterialFormValues) => {
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
        title: 'ماده اولیه با موفقیت بروزرسانی شد',
        variant: "success",
        description: 'تغییرات مورد نظر با موفقیت اعمال شد',
        duration: 3000,
        className: "p-3 text-sm"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'خطا در بروزرسانی ماده اولیه',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: "error",
        duration: 4000,
        className: "p-3 text-sm"
      });
    },
  });

  const onSubmit = (data: MaterialFormValues) => {
    if (isEditing) {
      updateMaterialMutation.mutate(data);
    } else {
      addMaterialMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#2C2F33] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center w-full">{isEditing ? 'ویرایش ماده اولیه' : 'افزودن ماده اولیه جدید'}</DialogTitle>
          <Button
            variant="ghost"
            className="h-6 w-6 p-0 rounded-full absolute left-4 top-4 text-gray-400 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-1">
  <FormLabel className="text-white">نام ماده اولیه</FormLabel>
  <span className="text-blue-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    placeholder="نام ماده اولیه را وارد کنید"
    className="bg-[#23272A] border border-gray-700 text-white placeholder-gray-400 rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 transition-all duration-200"
    {...field}
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
  <FormLabel className="text-white">قیمت هر گرم (تومان)</FormLabel>
  <span className="text-green-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    placeholder="قیمت ماده اولیه (تومان) را وارد کنید"
    type="number"
    className="bg-[#23272A] border border-gray-700 text-white placeholder-gray-400 rounded-xl shadow-md focus:ring-2 focus:ring-green-500 transition-all duration-200"
    {...field}
    onChange={(e) => field.onChange(Number(e.target.value))}
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
  <FormLabel className="text-white">موجودی (گرم)</FormLabel>
  <span className="text-yellow-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
  </span>
</div>
<FormControl>
  <Input
    placeholder="موجودی را وارد کنید"
    type="number"
    className="bg-[#23272A] border border-gray-700 text-white placeholder-gray-400 rounded-xl shadow-md focus:ring-2 focus:ring-yellow-500 transition-all duration-200"
    {...field}
    onChange={(e) => field.onChange(Number(e.target.value))}
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
    className="border-gray-700 text-gray-400 hover:bg-[#23272A] hover:text-white rounded-lg px-5 py-2 transition-all shadow-sm"
  >
    انصراف
  </Button>
  <Button
    type="submit"
    className="bg-[#5865F2] hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-bold shadow-md transition-all disabled:opacity-60"
    disabled={addMaterialMutation.isPending || updateMaterialMutation.isPending}
  >
    {addMaterialMutation.isPending || updateMaterialMutation.isPending ? (
      <>
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        در حال ثبت...
      </>
    ) : isEditing ? (
      'ذخیره تغییرات'
    ) : (
      'افزودن ماده اولیه'
    )}
  </Button>
</div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialForm;
