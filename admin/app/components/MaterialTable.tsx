import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "react-query";
import { Material } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Search, Plus, Loader2, AlertCircle } from "lucide-react";

export const MaterialTable = () => {
  const { toast } = useToast();
  const { data, isError, isLoading, error } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      console.log('Fetching materials from API...');
      try {
        const res = await fetch('/api/materials');
        console.log('API response status:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error('Error response:', errorData);
          throw new Error(errorData?.message || `Error: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Received ${data?.length || 0} materials from API`);
        
        if (!Array.isArray(data)) {
          console.error('Data is not an array:', data);
          throw new Error('Invalid data format: expected an array');
        }
        
        if (data.length > 0) {
          console.log('First material example:', JSON.stringify(data[0], null, 2));
        }
        
        return data;
      } catch (err) {
        console.error('Error fetching materials:', err);
        toast({
          variant: "destructive",
          title: "خطا در بارگیری مواد اولیه",
          description: err instanceof Error ? err.message : 'خطای نامشخص'
        });
        throw err;
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="جستجو در مواد اولیه..."
              className="w-64 bg-[#23272A] border-gray-700 text-white placeholder-gray-400 pr-10 pl-32 h-8 rounded-lg text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Button 
              variant="default" 
              className="absolute left-0 top-0 h-8 px-3 bg-[#5865F2] hover:bg-blue-600 text-white rounded-r-none text-sm"
            >
              جستجو
            </Button>
          </div>
        </div>
        <Button className="bg-[#5865F2] hover:bg-blue-600 text-white h-8 text-sm">
          <Plus className="h-3.5 w-3.5 ml-2" />
          افزودن ماده اولیه
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-sm">نام</TableHead>
              <TableHead className="text-sm">دسته‌بندی</TableHead>
              <TableHead className="text-sm">قیمت</TableHead>
              <TableHead className="text-sm">واحد</TableHead>
              <TableHead className="text-sm">موجودی</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <span>در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-red-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span>خطا در بارگیری داده‌ها</span>
                    <p className="text-sm mt-1">{error?.message || 'لطفاً مجدداً تلاش کنید'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data && data.length > 0 ? (
              data.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium py-3">{material.name}</TableCell>
                  <TableCell className="py-3">{material.category}</TableCell>
                  <TableCell className="py-3">{material.price.toLocaleString()} تومان</TableCell>
                  <TableCell className="py-3">{material.unit}</TableCell>
                  <TableCell className="py-3">{material.stock}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        title="ویرایش"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  موردی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 