import { useToast } from "@/hooks/use-toast";
import { useQuery } from "react-query";
import { Recipe } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Search, Plus, Loader2, AlertCircle, Edit, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { RecipeDialog } from "./RecipeDialog";
import "./RecipeTable.css";

export const RecipeTable = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<Record<number, any[]>>({});

  const { data, isError, isLoading, error, refetch } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/recipes');
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || `Error: ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: expected an array');
        }
        return data;
      } catch (err) {
        console.error('Error fetching recipes:', err);
        toast({
          variant: "destructive",
          title: "خطا در بارگیری رسپی‌ها",
          description: err instanceof Error ? err.message : 'خطای نامشخص',
          duration: 4000,
          className: "p-3 text-sm"
        });
        throw err;
      }
    }
  });

  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(recipe => {
        fetchRecipeIngredients(recipe.id);
      });
    }
  }, [data]);

  const fetchRecipeIngredients = async (recipeId: number) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/ingredients`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ingredients for recipe ${recipeId}`);
      }
      const ingredientsData = await res.json();
      setRecipeIngredients(prev => ({
        ...prev,
        [recipeId]: ingredientsData
      }));
    } catch (error) {
      console.error(`Error fetching ingredients for recipe ${recipeId}:`, error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این رسپی اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('خطا در حذف رسپی');
      }
      toast({
        title: "رسپی با موفقیت حذف شد",
        variant: "success",
        duration: 3000,
        className: "p-3 text-sm"
      });
      refetch();
    } catch (error) {
      toast({
        title: "خطا در حذف رسپی",
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: "error",
        duration: 4000,
        className: "p-3 text-sm"
      });
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditRecipe(recipe);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditRecipe(null);
  };

  const handleDialogSubmit = () => {
    refetch();
    closeDialog();
  };

  const filteredRecipes = data?.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <style>{`
        .custom-table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
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
        .custom-table .action-btn {
          border-radius: 0.6rem;
          margin: 0 0.22rem;
          font-size: 1rem;
          box-shadow: 0 1px 4px 0 rgba(99,102,241,0.07);
          transition: background 0.18s, color 0.18s, box-shadow 0.16s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.45rem 0.65rem;
        }
        .custom-table .action-btn.edit {
          background: linear-gradient(270deg, #c7d2fe 0%, #a5b4fc 100%);
          color: #3730a3;
          border: none;
        }
        .custom-table .action-btn.edit:hover {
          background: linear-gradient(270deg, #6366f1 0%, #3730a3 100%);
          color: #fff;
          box-shadow: 0 2px 8px 0 rgba(99,102,241,0.18);
        }
        .custom-table .action-btn.delete {
          background: linear-gradient(270deg, #fecaca 0%, #fca5a5 100%);
          color: #b91c1c;
          border: none;
        }
        .custom-table .action-btn.delete:hover {
          background: linear-gradient(270deg, #ef4444 0%, #991b1b 100%);
          color: #fff;
          box-shadow: 0 2px 8px 0 rgba(239,68,68,0.18);
        }
        .custom-table .action-btn:focus {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }
      `}</style>

      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#5865F2] hover:bg-blue-600 text-white h-8 text-sm">
          <Plus className="h-3.5 w-3.5 ml-2" />
          افزودن رسپی جدید
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="جستجو در رسپی‌ها..."
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
              onClick={() => setSearchQuery(searchQuery)}
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
              <TableHead className="text-right">نام رسپی</TableHead>
              <TableHead className="text-right">دسته‌بندی</TableHead>
              <TableHead className="text-center">تعداد مواد</TableHead>
              <TableHead className="text-center">ضریب قیمت</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
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
                    <p className="text-sm mt-1">{error?.message || 'لطفاً مجدداً تلاش کنید'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRecipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  موردی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium py-3 text-right">{recipe.name}</TableCell>
                  <TableCell className="py-3 text-right">{recipe.category}</TableCell>
                  <TableCell className="py-3 text-center">
                    {recipeIngredients[recipe.id] 
                      ? recipeIngredients[recipe.id].length 
                      : <span className="text-gray-400">در حال بارگذاری...</span>}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    {typeof recipe.priceCoefficient === 'number' 
                      ? recipe.priceCoefficient.toFixed(1)
                      : parseFloat(recipe.priceCoefficient).toFixed(1)}
                  </TableCell>
                  <TableCell className="py-3 action-cell">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(recipe)}
                        className="action-btn edit h-7 w-7"
                        title="ویرایش"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(recipe.id)}
                        className="action-btn delete h-7 w-7"
                        title="حذف"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <RecipeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
        recipe={editRecipe}
      />
    </div>
  );
}; 