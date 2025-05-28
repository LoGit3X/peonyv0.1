import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  MoreVertical
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Material } from '@/lib/types';
import { formatNumber, formatPrice } from '@/lib/utils';
import MaterialForm from './MaterialForm';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface MaterialTableProps {
  onAddNew: () => void;
}

const MaterialTable: FC<MaterialTableProps> = ({ onAddNew }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const itemsPerPage = 10;

  // Fetch materials
  const { data: materials, isLoading, isError, error, refetch } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      console.log('Fetching materials from API directly...');
      try {
        // Direct fetch bypassing any custom fetch wrappers
        const response = await window.fetch('/api/materials');
        if (!response.ok) {
          console.error('API error in MaterialTable:', response.status, response.statusText);
          const text = await response.text();
          console.error('Response body:', text);
          throw new Error(`${response.status}: ${text || response.statusText}`);
        }

        const materialsData = await response.json();
        console.log('Materials data from API:', materialsData);
        return materialsData;
      } catch (error) {
        console.error('Error fetching materials:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5000, // 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Delete material mutation

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/materials/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: 'ماده اولیه با موفقیت حذف شد',
        variant: "success",
        description: 'ماده اولیه مورد نظر با موفقیت از سیستم حذف شد',
        duration: 3000,
        className: "p-3 text-sm"
      });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: 'خطا در حذف ماده اولیه',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        duration: 4000,
        className: "p-3 text-sm"
      });
    },
  });

  // Filter and sort materials
  const filteredMaterials = materials
    ? materials.filter(material => {
        // Ensure material has name property before accessing it
        if (!material || !material.name) return false;

        // If no search is applied, show all materials
        if (!searchApplied) return true;

        const searchLower = searchApplied.toLowerCase();
        const nameLower = material.name.toLowerCase();

        // Simple includes check for the name field
        return nameLower.includes(searchLower);
      })
    : [];

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  // Paginate materials
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);
  const paginatedMaterials = sortedMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle edit material
  const handleEdit = (material: Material) => {
    console.log('Editing material:', material);
    setEditingMaterial(material);
    setIsEditModalOpen(true);
  };

  // Handle delete material
  const handleDelete = (material: Material) => {
    setDeletingMaterial(material);
    setShowDeleteConfirm(true);
  };

  // Debounced search
  const debounce = useCallback((fn: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }, []);

  // Set up debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      console.log(`Debounced search triggered with: "${value}"`);
      setSearchApplied(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Apply debounced search when search input changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Focus the search input on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Clear search when component unmounts or when materials change
  useEffect(() => {
    console.log("Materials data changed, resetting search");
    setSearchQuery('');
    setSearchApplied('');
  }, [materials]);

  // Debugging output
  useEffect(() => {
    console.log(`Current search term: "${searchApplied}"`);
    console.log(`Materials array length: ${materials?.length || 0}`);
    console.log(`Filtered materials length: ${filteredMaterials.length}`);
  }, [searchApplied, materials, filteredMaterials.length]);

  const handleSearch = () => {
    // Implement search logic here if needed
    // For now, the search is handled by the onChange event of the input
  };

  return (
    <div className="space-y-4">
      <style>{`
        .custom-table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }
        .custom-table thead tr th {
          background: #23272a;
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          border-top-right-radius: 0.5rem;
          border-top-left-radius: 0.5rem;
          box-shadow: 0 1px 4px 0 rgba(99,102,241,0.08);
          letter-spacing: 0.01em;
          padding-top: 0.7rem;
          padding-bottom: 0.7rem;
        }
        .custom-table tbody tr:nth-child(even) {
          background-color: #23272a;
        }
        .custom-table tbody tr:nth-child(odd) {
          background-color: #202225;
        }
        .custom-table tbody tr {
          transition: background 0.22s, box-shadow 0.18s;
        }
        .custom-table tbody tr:hover {
          background-color: #36393f;
          box-shadow: 0 2px 12px 0 rgba(99,102,241,0.10);
        }
        .custom-table td, .custom-table th {
          border-bottom: 1px solid #36393f !important;
          padding: 0.9rem 0.8rem;
        }
        .custom-table .action-cell {
          text-align: center !important;
        }
        /* استایل مدرن و گرادیانی برای دکمه‌های عملیات */
        .custom-table .action-btn {
          border-radius: 0.4rem;
          margin: 0 0.18rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem !important;
          height: 2rem !important;
          padding: 0 !important;
          position: relative;
          overflow: visible;
          border: none;
          transition: all 0.2s ease;
        }
        .custom-table .button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .custom-table .action-btn.edit {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
        }
        .custom-table .action-btn.edit:hover {
          background: #3b82f6;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
        }
        .custom-table .action-btn.delete {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .custom-table .action-btn.delete:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
        }
        .custom-table .action-btn:active {
          transform: scale(0.92);
        }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5865F2] hover:bg-blue-600 text-white h-8 text-sm"
        >
          <Plus className="h-3.5 w-3.5 ml-2" />
          افزودن ماده اولیه
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="جستجو در مواد اولیه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-[#23272A] border-gray-700 text-white placeholder-gray-400 pr-10 pl-32 h-8 rounded-lg text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </div>
            <Button
              variant="default"
              className="absolute left-0 top-0 h-8 px-3 bg-[#5865F2] hover:bg-blue-600 text-white rounded-r-none text-sm"
              onClick={() => handleSearch()}
            >
              جستجو
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border shadow-lg overflow-hidden">
        <Table className="custom-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-right">نام</TableHead>
              <TableHead className="w-[120px] text-center">قیمت (تومان)</TableHead>
              <TableHead className="w-[120px] text-center">موجودی</TableHead>
              <TableHead className="w-[100px] text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <span>در حال بارگذاری...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-red-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span>خطا در بارگیری داده‌ها</span>
                    <p className="text-sm mt-1">{error?.message || 'لطفاً مجدداً تلاش کنید'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  موردی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium py-3">{material.name}</TableCell>
                  <TableCell className="text-center py-3">{material.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center py-3">
                    <span className="min-w-[50px] text-center">
                      {(material.stock || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 action-cell">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(material)}
                        className="action-btn edit"
                        title="ویرایش"
                      >
                        <span className="button-icon">
                          <Edit size={16} strokeWidth={2.5} />
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(material)}
                        className="action-btn delete"
                        title="حذف"
                      >
                        <span className="button-icon">
                          <Trash size={16} strokeWidth={2.5} />
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <MaterialForm
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={editingMaterial || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#2C2F33] border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">حذف ماده اولیه</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              آیا از حذف ماده اولیه "{deletingMaterial?.name}" اطمینان دارید؟
              این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-end">
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-[#23272A] hover:text-white">انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deletingMaterial && deleteMaterialMutation.mutate(deletingMaterial.id)}
              disabled={deleteMaterialMutation.isPending}
            >
              {deleteMaterialMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Material Modal */}
      <MaterialForm
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
};

export default MaterialTable;
