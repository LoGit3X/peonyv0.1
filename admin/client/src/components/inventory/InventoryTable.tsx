import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash,
  Search,
  Plus,
  Warehouse
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Material } from '@/lib/types';
import { formatNumber, formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import InventoryForm from './InventoryForm';
import styles from './InventoryTable.module.css';

const InventoryTable: FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  // Fetch materials
  const { data: materials, isLoading, isError, error } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      console.log('Fetching materials for inventory...');
      try {
        const response = await window.fetch('/api/materials');
        if (!response.ok) {
          console.error('API error in InventoryTable:', response.status, response.statusText);
          const text = await response.text();
          console.error('Response body:', text);
          throw new Error(`${response.status}: ${text || response.statusText}`);
        }

        const data = await response.json();
        console.log(`Received ${data.length} materials from API`);

        if (!Array.isArray(data)) {
          console.error('Data is not an array:', data);
          throw new Error('Invalid data format');
        }

        return data;
      } catch (error) {
        console.error('Error fetching materials:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
  });

  // Apply search filter
  const handleSearch = useCallback(() => {
    setSearchApplied(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle key press in search input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Filter materials based on search query
  const filteredMaterials = materials?.filter(material => {
    if (!searchApplied) return true;
    return material.name.toLowerCase().includes(searchApplied.toLowerCase());
  }) || [];

  // Sort materials by name
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // Paginate materials
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);
  const paginatedMaterials = sortedMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle edit material
  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsEditModalOpen(true);
  };

  // Calculate statistics
  const totalInventoryValue = sortedMaterials.reduce((total, material) => {
    return total + (material.price * material.stock);
  }, 0);

  // Count materials with stock > 0
  const materialsWithStock = sortedMaterials.filter(material => material.stock > 0).length;

  // Total number of materials
  const totalMaterials = sortedMaterials.length;

  return (
    <>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="جستجو در مواد اولیه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              ref={searchInputRef}
              className="w-64 bg-[#23272A] border-gray-700 text-white placeholder-gray-400 pr-10 pl-32 h-8 rounded-lg text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Button
              variant="default"
              className="absolute left-0 top-0 h-8 px-3 bg-[#5865F2] hover:bg-blue-600 text-white rounded-r-none text-sm"
              onClick={handleSearch}
            >
              جستجو
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border shadow-lg overflow-hidden">
        <Table className={styles['custom-table']}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%] text-right">نام ماده اولیه</TableHead>
              <TableHead className="w-[17.5%] text-center">قیمت واحد (تومان)</TableHead>
              <TableHead className="w-[17.5%] text-center">موجودی (گرم)</TableHead>
              <TableHead className="w-[25%] text-center">ارزش موجودی (تومان)</TableHead>
              <TableHead className="w-[10%] text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <span>در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-red-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span>خطا در بارگیری داده‌ها</span>
                    <p className="text-sm mt-1">{error instanceof Error ? error.message : 'خطای نامشخص'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <Warehouse className="h-8 w-8 mb-2" />
                    <span>هیچ ماده اولیه‌ای یافت نشد</span>
                    {searchApplied && (
                      <p className="text-sm mt-1">
                        جستجو برای: <span className="font-medium">{searchApplied}</span>
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium text-right">{material.name}</TableCell>
                  <TableCell className="text-center">{formatPrice(material.price)}</TableCell>
                  <TableCell className="text-center">{formatNumber(material.stock)}</TableCell>
                  <TableCell className="text-center">{formatPrice(material.price * material.stock)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100/10"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  مجموع ارزش موجودی انبار:
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-green-500">
                {formatPrice(totalInventoryValue)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  مواد اولیه که موجودی دارند:
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-blue-500">
                {materialsWithStock} مورد
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                  تعداد کل مواد اولیه:
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-gray-300">
                {totalMaterials} مورد
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 text-white border-gray-700"
            >
              <span>{'<'}</span>
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className={`h-8 w-8 p-0 ${
                  currentPage === i + 1
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'text-white border-gray-700'
                }`}
              >
                <span>{i + 1}</span>
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 text-white border-gray-700"
            >
              <span>{'>'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {editingMaterial && (
        <InventoryForm
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          initialData={editingMaterial}
        />
      )}
    </>
  );
};

export default InventoryTable;
