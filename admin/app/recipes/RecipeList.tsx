import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RecipeDialog } from "@/components/RecipeDialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes");
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      const data = await response.json();
      setRecipes(data);

      // Fetch ingredients count for each recipe
      data.forEach((recipe) => {
        fetchRecipeIngredients(recipe.id);
      });
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        variant: "destructive",
        title: "خطا در دریافت اطلاعات",
        description: "دریافت اطلاعات رسپی‌ها با خطا مواجه شد.",
      });
    }
  };

  const fetchRecipeIngredients = async (recipeId) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/ingredients`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ingredients for recipe ${recipeId}`);
      }
      const data = await response.json();

      setRecipeIngredients((prev) => ({
        ...prev,
        [recipeId]: data,
      }));
    } catch (error) {
      console.error(`Error fetching ingredients for recipe ${recipeId}:`, error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      toast({
        title: "رسپی با موفقیت حذف شد",
        duration: 2000,
      });

      fetchRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({
        variant: "destructive",
        title: "خطا در حذف رسپی",
        description: "حذف رسپی با خطا مواجه شد.",
      });
    }
  };

  const handleSubmit = () => {
    setSelectedRecipe(null);
    fetchRecipes();
  };

  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">مدیریت رسپی‌ها</h1>
        <div className="flex gap-4">
          <Input
            className="w-64"
            placeholder="جستجو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button>افزودن رسپی</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>افزودن رسپی جدید</DialogTitle>
              </DialogHeader>
              <RecipeDialog onSubmit={handleSubmit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right bg-gradient-to-l from-[#3b4252] to-[#23272a] text-white font-bold text-base">نام</TableHead>
              <TableHead className="text-right bg-gradient-to-l from-[#3b4252] to-[#23272a] text-white font-bold text-base">دسته‌بندی</TableHead>
              <TableHead className="text-right bg-gradient-to-l from-[#3b4252] to-[#23272a] text-white font-bold text-base">تعداد مواد اولیه</TableHead>
              <TableHead className="text-center bg-gradient-to-l from-[#3b4252] to-[#23272a] text-white font-bold text-base">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecipes.map((recipe, idx) => (
              <TableRow key={recipe.id} className={idx % 2 === 0 ? 'bg-[#24262b]' : 'bg-[#23272a] hover:bg-[#36393f]'}>
                <TableCell className="font-medium text-white">{recipe.name}</TableCell>
                <TableCell className="text-white">{recipe.category}</TableCell>
                <TableCell className="text-white">
                  {recipeIngredients[recipe.id] ? recipeIngredients[recipe.id].length : (
                    <span className="text-gray-400">در حال بارگذاری...</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRecipe(recipe)}
                          className="rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-500 hover:text-white transition-colors h-8 w-8"
                          title="ویرایش"
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>ویرایش رسپی</DialogTitle>
                        </DialogHeader>
                        <RecipeDialog recipe={recipe} onSubmit={handleSubmit} />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRecipeToDelete(recipe);
                        setShowConfirmDelete(true);
                      }}
                      className="rounded-md bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white transition-colors h-8 w-8"
                      title="حذف"
                    >
                      <AiOutlineDelete className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {currentRecipes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  هیچ رسپی‌ای یافت نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page);
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">حذف رسپی</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <AiOutlineInfoCircle className="mx-auto text-4xl text-yellow-500" />
            <p>آیا از حذف رسپی "{recipeToDelete?.name}" اطمینان دارید؟</p>
            <p className="text-sm text-gray-500">این عملیات غیرقابل بازگشت است.</p>
          </div>
          <DialogFooter className="flex space-x-2 justify-center">
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete(recipeToDelete.id);
                setShowConfirmDelete(false);
              }}
            >
              بله، حذف شود
            </Button>
            <DialogClose asChild>
              <Button variant="outline">انصراف</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
