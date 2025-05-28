import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Recipe, Material, RecipeIngredient } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash, Loader2, Search, Upload, ImagePlus, Image } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resolveStaticPath } from "../utils/staticPaths";

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  recipe: Recipe | null;
}

export const RecipeDialog = ({ 
  open, 
  onOpenChange, 
  onClose, 
  onSubmit, 
  recipe 
}: RecipeDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    category: 'Hot Coffee',
    priceCoefficient: 3.3,
    description: '',
    imageUrl: '',
  });
  const [ingredients, setIngredients] = useState<Partial<RecipeIngredient>[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Image upload related states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch all materials for ingredients selection with error handling
  const { data: materialsData, isError: materialsError } = useQuery<Material[]>('materials', async () => {
    const res = await fetch('/api/materials');
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch materials' }));
      throw new Error(error.message);
    }
    return res.json();
  }, {
    onError: (error) => {
      toast({
        title: "خطا در دریافت مواد اولیه",
        description: error instanceof Error ? error.message : "خطای ناشناخته",
        variant: "destructive",
        duration: 4000,
        className: "p-3 text-sm"
      });
    }
  });

  // Fetch recipe ingredients with improved error handling and caching
  const { data: recipeIngredients, isLoading: ingredientsLoading } = useQuery(
    ['recipe-ingredients', recipe?.id],
    async () => {
      if (!recipe?.id) return [];
      const res = await fetch(`/api/recipes/${recipe.id}/ingredients`);
      if (!res.ok) {
        throw new Error('Failed to fetch recipe ingredients');
      }
      return res.json();
    },
    {
      enabled: !!recipe?.id,
      onSuccess: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const formattedIngredients = data.map(ing => ({
            materialId: Number(ing.materialId),
            amount: Number(ing.amount)
          }));
          setIngredients(formattedIngredients);
        } else {
          setDefaultIngredient();
        }
      },
      onError: (error) => {
        console.error('Error loading recipe ingredients:', error);
        toast({
          title: "خطا در بارگذاری مواد اولیه",
          description: error instanceof Error ? error.message : "خطای ناشناخته",
          variant: "destructive",
          duration: 4000,
          className: "p-3 text-sm"
        });
        setDefaultIngredient();
      }
    }
  );

  const setDefaultIngredient = useCallback(() => {
    // Don't pre-select any material, leave it undefined so user must search
    setIngredients([{ materialId: undefined, amount: 1 }]);
  }, []);

  // Load recipe data when editing with improved caching
  useEffect(() => {
    if (recipe) {
      console.log(`Loading recipe data for editing:`, recipe);
      
      // Set form data including imageUrl
      setFormData({
        name: recipe.name || '',
        category: recipe.category || 'Hot Coffee',
        priceCoefficient: recipe.priceCoefficient || 3.3,
        description: recipe.description || '',
        imageUrl: recipe.imageUrl || '',  // Explicitly preserve the imageUrl
      });
      
      console.log(`Recipe imageUrl set to: ${recipe.imageUrl || '(none)'}`);
    } else {
      // Reset for new recipe
      setFormData({
        name: '',
        category: 'Hot Coffee',
        priceCoefficient: 3.3,
        description: '',
        imageUrl: '',  // Clear imageUrl for new recipes
      });
      setDefaultIngredient();
    }
  }, [recipe, setDefaultIngredient]);

  // Update the useEffect for image preview
  useEffect(() => {
    if (!open) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (recipe?.imageUrl) {
      const resolvedUrl = resolveStaticPath(recipe.imageUrl);
      console.log(`Setting image preview for recipe ${recipe.id} to: ${resolvedUrl}`);
      setImagePreview(resolvedUrl);
    } else {
      console.log(`No image URL for recipe ${recipe?.id || 'new'}, clearing preview.`);
      setImagePreview(null);
    }
  }, [recipe, open]); // recipe.imageUrl is implicitly covered by `recipe` dependency

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = "نام رسپی الزامی است";
    }
    if (!formData.category?.trim()) {
      errors.category = "دسته‌بندی الزامی است";
    }
    if (!formData.priceCoefficient || formData.priceCoefficient < 0.1) {
      errors.priceCoefficient = "ضریب قیمت باید حداقل 0.1 باشد";
    }
    
    const validIngredients = ingredients.filter(ing => 
      ing.materialId && ing.materialId > 0 && 
      ing.amount && ing.amount > 0
    );

    if (validIngredients.length === 0) {
      errors.ingredients = "حداقل یک ماده اولیه باید به رسپی اضافه شود";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    
    // برای ضریب قیمت باید حداقل 0.1 باشد
    if (name === 'priceCoefficient' && numValue < 0.1) {
      setFormData(prev => ({ ...prev, [name]: 0.1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const addIngredient = () => {
    // Check if materials exist but don't pre-select any
    if (!materialsData || materialsData.length === 0) {
      toast({
        title: "خطا",
        description: "هیچ ماده اولیه‌ای در سیستم ثبت نشده است",
        variant: "destructive",
        duration: 4000,
        className: "p-3 text-sm"
      });
      return;
    }
    // Add a new ingredient with no pre-selected materialId
    setIngredients(prev => [...prev, { materialId: undefined, amount: 1 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    setIngredients(prev => {
      const newIngredients = [...prev];
      
      if (field === 'materialId') {
        // تبدیل materialId به عدد
        const materialId = parseInt(value, 10);
        if (!isNaN(materialId) && materialId > 0) {
          newIngredients[index] = { ...newIngredients[index], materialId };
        }
      } else if (field === 'amount') {
        // تبدیل مقدار به عدد
        const amount = Math.max(1, Math.round(Number(value) || 1));
        newIngredients[index] = { ...newIngredients[index], amount };
      } else {
        newIngredients[index] = { ...newIngredients[index], [field]: value };
      }
      
      return newIngredients;
    });
  };

  // Image upload handlers
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
      toast({
        title: "خطا",
        description: "فرمت فایل معتبر نیست. فقط فرمت‌های JPG، PNG، GIF و WebP پشتیبانی می‌شوند.",
        variant: "destructive",
        duration: 4000,
        className: "p-3 text-sm"
      });
      return;
    }
    
    // Validate file size (max 5MB) - Limit removed by Roo
    // if (file.size > 5 * 1024 * 1024) {
    //   toast({
    //     title: "خطا",
    //     description: "حجم فایل بیش از حد مجاز (5 مگابایت) است.",
    //     variant: "destructive",
    //     duration: 4000,
    //     className: "p-3 text-sm"
    //   });
    //   return;
    // }
    
    setImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleDeleteImage = async () => {
    if (!recipe?.id) {
      // For new recipes, just clear the preview
      setImageFile(null);
      setImagePreview(null);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      return;
    }
    
    try {
      setUploadingImage(true);
      console.log(`Deleting image for recipe ${recipe.id}`);
      
      const res = await fetch(`/api/recipes/${recipe.id}/image`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error response from server: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`خطا در حذف تصویر: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log(`Image delete success:`, data);
      
      setImageFile(null);
      setImagePreview(null);
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      
      toast({
        title: "تصویر با موفقیت حذف شد",
        variant: "success",
        duration: 3000,
        className: "p-3 text-sm"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "خطا در حذف تصویر",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
        duration: 4000,
        className: "p-3 text-sm"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImage = async (recipeId: number): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      console.log(`Uploading image for recipe ${recipeId}`, imageFile);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      console.log(`Sending POST request to /api/recipes/${recipeId}/image`);
      const res = await fetch(`/api/recipes/${recipeId}/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error response from server: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`خطا در آپلود تصویر: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log(`Image upload success:`, data);
      
      // Verify the image URL was saved correctly
      console.log(`Verifying image URL was stored correctly for recipe ${recipeId}`);
      const verifyRes = await fetch(`/api/recipes/${recipeId}`);
      
      console.log(`Verification response status: ${verifyRes.status}`);
      if (verifyRes.ok) {
        const recipe = await verifyRes.json();
        console.log(`Recipe after upload:`, recipe);
        
        if (!recipe.imageUrl) {
          console.error(`Image URL is missing in the database after upload`);
        } else if (recipe.imageUrl !== data.imageUrl) {
          console.warn(`Image URL mismatch: ${recipe.imageUrl} vs ${data.imageUrl}`);
          // Try to update the recipe directly to fix the imageUrl
          const updateRes = await fetch(`/api/recipes/${recipeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.imageUrl }),
          });
          if (!updateRes.ok) {
            console.error("Failed to update recipe with image URL");
          } else {
            console.log("Successfully updated recipe with corrected image URL");
          }
        } else {
          console.log(`Recipe ${recipeId} successfully updated with image URL ${data.imageUrl}`);
        }
      } else {
        console.error(`Failed to verify recipe data after image upload`);
      }
      
      toast({
        title: "تصویر با موفقیت بارگذاری شد",
        variant: "success",
        duration: 3000,
        className: "p-3 text-sm"
      });
      
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطا در آپلود تصویر",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
        duration: 4000,
        className: "p-3 text-sm"
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Explicitly handle image URL preservation for editing
      const recipeData = {
        ...formData,
        priceCoefficient: Number(formData.priceCoefficient)
      };
      
      // Make sure to preserve the image URL if not uploading a new image
      if (recipe?.id && !imageFile && recipe.imageUrl) {
        console.log(`Preserving existing image URL: ${recipe.imageUrl}`);
        recipeData.imageUrl = recipe.imageUrl;
      }
      
      let recipeId;
      
      if (recipe?.id) {
        // Update existing recipe
        console.log(`Updating recipe ${recipe.id} with data:`, recipeData);
        
        const updateRes = await fetch(`/api/recipes/${recipe.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData),
        });
        
        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({ message: 'خطا در بروزرسانی رسپی' }));
          throw new Error(errorData.message);
        }
        
        recipeId = recipe.id;
      } else {
        // Create new recipe
        const createRes = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData),
        });
        
        if (!createRes.ok) {
          const errorData = await createRes.json().catch(() => ({ message: 'خطا در ایجاد رسپی' }));
          throw new Error(errorData.message);
        }
        
        const newRecipe = await createRes.json();
        recipeId = newRecipe.id;
      }
      
      // Handle image processing and verification
      if (imageFile) {
        // Upload new image if selected
        console.log(`Uploading new image for recipe ${recipeId}`);
        const imageUrl = await uploadImage(recipeId);
        if (imageUrl) {
          console.log(`Image uploaded successfully: ${imageUrl}`);
          
          // Verify the image was saved in the database
          const verifyRecipeRes = await fetch(`/api/recipes/${recipeId}`);
          if (verifyRecipeRes.ok) {
            const updatedRecipe = await verifyRecipeRes.json();
            if (updatedRecipe.imageUrl !== imageUrl) {
              console.warn(`Image URL verification failed. In DB: ${updatedRecipe.imageUrl}, Expected: ${imageUrl}`);
              
              // Try one more update
              try {
                const fixRes = await fetch(`/api/recipes/${recipeId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageUrl }),
                });
                
                if (fixRes.ok) {
                  console.log("Successfully fixed image URL in database");
                }
              } catch (fixError) {
                console.error("Failed to fix image URL:", fixError);
              }
            } else {
              console.log(`Image URL verification successful: ${imageUrl}`);
            }
            
            // Update form data with verified image URL
            setFormData(prev => ({ ...prev, imageUrl: updatedRecipe.imageUrl || imageUrl }));
          }
        }
      } else if (recipe?.id && recipe.imageUrl) {
        // No new image file, preserve existing image
        console.log(`Preserving existing image: ${recipe.imageUrl}`);
        
        // Verify the image URL is still in the database
        const verifyRecipeRes = await fetch(`/api/recipes/${recipeId}`);
        if (verifyRecipeRes.ok) {
          const updatedRecipe = await verifyRecipeRes.json();
          if (!updatedRecipe.imageUrl && recipe.imageUrl) {
            console.warn(`Existing image URL was lost. Restoring from: ${recipe.imageUrl}`);
            
            // Try to restore the image URL
            try {
              const fixRes = await fetch(`/api/recipes/${recipeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: recipe.imageUrl }),
              });
              
              if (fixRes.ok) {
                console.log("Successfully restored image URL in database");
              }
            } catch (fixError) {
              console.error("Failed to restore image URL:", fixError);
            }
          }
          
          // Update form data with current image URL from database
          setFormData(prev => ({ 
            ...prev, 
            imageUrl: updatedRecipe.imageUrl || recipe.imageUrl 
          }));
        } else {
          // Fallback to original value if verification failed
          setFormData(prev => ({ ...prev, imageUrl: recipe.imageUrl }));
        }
      }
      
      // Update ingredients
      const validIngredients = ingredients.filter(ing => 
        ing.materialId && ing.materialId > 0 && 
        ing.amount && ing.amount > 0
      );
      
      const sanitizedIngredients = validIngredients.map(ing => ({
        materialId: parseInt(String(ing.materialId), 10),
        amount: Math.round(Number(ing.amount))
      }));
      
      const ingredientsRes = await fetch(`/api/recipes/${recipeId}/ingredients`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedIngredients),
      });
      
      if (!ingredientsRes.ok) {
        const errorData = await ingredientsRes.json().catch(() => ({ message: 'خطا در بروزرسانی مواد اولیه' }));
        throw new Error(errorData.message);
      }

      // Invalidate and refetch queries to update UI immediately
      await Promise.all([
        queryClient.invalidateQueries('recipes'),
        queryClient.invalidateQueries(['recipe', recipeId]),
        queryClient.invalidateQueries(['recipe-ingredients', recipeId]),
        queryClient.invalidateQueries('materials')
      ]);

      toast({
        title: recipe?.id ? "رسپی بروزرسانی شد" : "رسپی جدید ایجاد شد",
        description: "عملیات با موفقیت انجام شد",
        variant: "success",
        duration: 3000,
        className: "p-3 text-sm"
      });

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting recipe:', error);
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطای ناشناخته در ذخیره رسپی",
        variant: "error",
        duration: 4000,
        className: "p-3 text-sm"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaterialName = (materialId: number | undefined) => {
    if (!materialId) return 'انتخاب ماده اولیه';
    return materialsData?.find(m => m.id === materialId)?.name || 'انتخاب ماده اولیه';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[1000px] sm:h-auto md:max-h-[98vh] lg:max-h-[95vh] p-0 flex flex-col overflow-auto" dir="rtl">
                    <DialogHeader className="px-3 py-2 border-b flex justify-center">
            {/* Removed dialog title */}
            
            <div className="flex gap-3 justify-center w-full">
              <Button variant="outline" onClick={onClose} className="h-8 px-6 text-xs min-w-[100px]">انصراف</Button>
              <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="h-8 px-6 text-xs min-w-[100px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {recipe ? 'ویرایش رسپی' : 'ایجاد رسپی'}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          <div className="space-y-2">
            {/* بخش اطلاعات اصلی */}
            <div className="bg-card p-3 rounded-lg border shadow-sm">
              {/* Removed "اطلاعات اصلی" header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm font-medium">نام رسپی</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="نام رسپی را وارد کنید"
                    className="text-right text-sm h-8 font-medium"
                    dir="rtl" 
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive">{validationErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-sm font-medium">دسته‌بندی</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    defaultValue="Hot Coffee"
                  >
                    <SelectTrigger className="w-full text-right text-sm h-8 font-medium" dir="rtl">
                      <SelectValue placeholder="انتخاب دسته‌بندی">
                        {formData.category || "انتخاب دسته‌بندی"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end" dir="rtl">
                      <ScrollArea className="h-[200px]">
                        <SelectItem value="Hot Coffee">Hot Coffee</SelectItem>
                        <SelectItem value="Ice Coffee">Ice Coffee</SelectItem>
                        <SelectItem value="Hot Bar">Hot Bar</SelectItem>
                        <SelectItem value="Ice Bar">Ice Bar</SelectItem>
                        <SelectItem value="Shake">Shake</SelectItem>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Mocktail">Mocktail</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                        <SelectItem value="Smoothie">Smoothie</SelectItem>
                        <SelectItem value="Herbal Tea">Herbal Tea</SelectItem>
                        <SelectItem value="Protein Shakes">Protein Shakes</SelectItem>
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-xs text-destructive">{validationErrors.category}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="priceCoefficient" className="text-sm font-medium">ضریب قیمت</Label>
                  <Input
                    id="priceCoefficient"
                    name="priceCoefficient"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.priceCoefficient}
                    onChange={handleNumberInputChange}
                    placeholder="ضریب قیمت را وارد کنید"
                    className="text-center text-sm h-8 font-medium"
                    dir="ltr"
                  />
                  {validationErrors.priceCoefficient && (
                    <p className="text-xs text-destructive">{validationErrors.priceCoefficient}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground text-right">
                    ضریب قیمت جهت محاسبه قیمت نهایی محصول (پیش‌فرض: 3.3)
                  </p>
                </div>
              </div>
              
              {/* Recipe Image Upload and Description - Restructured */}
              <div className="mt-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium block">تصویر محصول</Label>
                  <div className="flex items-center justify-center">
                    {/* Image preview */}
                    <div className={`relative border border-dashed rounded-lg overflow-hidden flex flex-col items-center justify-center
                      ${imagePreview ? 'w-40 h-40 lg:w-52 lg:h-52' : 'w-40 h-40 lg:w-52 lg:h-52 bg-muted/30'}`}>
                      
                      {imagePreview ? (
                        <>
                          <img 
                            src={imagePreview} 
                            alt="Recipe preview" 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            type="button" 
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            onClick={handleDeleteImage}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <div 
                          className="flex flex-col items-center justify-center p-2 cursor-pointer w-full h-full"
                          onClick={handleImageClick}
                        >
                          <ImagePlus className="h-10 w-10 text-muted-foreground mb-1" />
                          <p className="text-[10px] text-center text-muted-foreground">
                            بارگذاری تصویر
                          </p>
                          <p className="text-[8px] text-center text-muted-foreground">
                            (حداکثر 5 مگابایت)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
                
                {/* Description textarea */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">توضیحات محصول</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="توضیحات مختصر درباره محصول را وارد کنید"
                    className="text-right text-sm resize-none h-40 mt-1 font-medium"
                    dir="rtl"
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-1">
                    این توضیحات در صفحه محصول به کاربران نمایش داده می‌شود
                  </p>
                </div>
              </div>
            </div>
            
            {/* بخش مواد اولیه */}
            <div className="bg-card p-3 rounded-lg border shadow-sm mb-1" dir="rtl">
              <div className="flex flex-col items-center mb-2">
                <Button 
                    type="button" 
                    onClick={addIngredient} 
                    variant="outline" 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-8 text-xs px-6 shadow-sm w-[150px]"
                    dir="rtl"
                  >
                    <Plus className="ml-1 h-4 w-4 text-white" />
                    افزودن ماده اولیه
                  </Button>
              </div>
              
              {ingredients.length === 0 ? (
                <div className="text-center py-5 text-muted-foreground bg-muted/20 rounded-lg">
                  <p className="text-sm">هنوز ماده اولیه‌ای اضافه نشده است</p>
                  <Button 
                    type="button" 
                    onClick={addIngredient} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 shadow-sm w-[180px]"
                  >
                    <Plus className="ml-1 h-4 w-4 text-white" />
                    افزودن ماده اولیه جدید
                  </Button>
                </div>
              ) : (
                <div className="max-h-full overflow-hidden w-full">
                  <ScrollArea className="max-h-[55vh] w-full custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right w-full" style={{ direction: 'rtl' }}>
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-start gap-2 bg-muted/10 py-1 px-2 rounded-lg">
                          <div className="flex flex-row items-center justify-between w-full gap-4 flex-row-reverse">
                            <div className="w-1/4">
                              <Label className="text-[11px] mb-1 font-semibold block">مقدار</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={ingredient.amount || ""}
                                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                                  min="1"
                                  step="1"
                                  className="text-center pl-9 pr-3 text-xs h-8 font-medium"
                                  dir="ltr"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-medium">
                                  گرم
                                </span>
                              </div>
                            </div>
                            
                            <div className="w-3/4">
                              <div className="flex justify-between items-center flex-row-reverse">
                                <Label className="text-[11px] mb-1 font-semibold block">ماده اولیه</Label>
                                                                  <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeIngredient(index)}
                                  className="hover:bg-destructive/10 hover:text-destructive h-5 w-5 ml-1 group"
                                >
                                  <Trash className="h-3 w-3 text-red-500 group-hover:text-red-600" />
                                </Button>
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between text-right text-xs h-8 font-medium"
                                    dir="rtl"
                                  >
                                    {ingredient.materialId ? getMaterialName(ingredient.materialId) : "انتخاب ماده اولیه"}
                                    <Search className="ml-1 h-3 w-3 shrink-0 text-blue-500" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 max-h-[300px] flex flex-col" align="end" dir="rtl">
                                  <Command dir="rtl" className="flex flex-col h-full">
                                    <div className="sticky top-0 z-10 bg-popover pt-2 px-2 pb-1 border-b">
                                      <div className="relative flex items-center">
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                                        <CommandInput placeholder="جستجوی ماده اولیه..." className="h-9 text-sm text-right font-medium pr-8 border-blue-200 focus:border-blue-400" dir="rtl" />
                                      </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                      <CommandEmpty className="text-xs py-6 text-center">موردی یافت نشد</CommandEmpty>
                                      <CommandGroup className="overflow-visible">
                                        {materialsData?.map(material => (
                                          <CommandItem
                                            key={material.id}
                                            value={material.name}
                                            onSelect={() => {
                                              updateIngredient(index, 'materialId', material.id.toString());
                                            }}
                                            className="text-right text-xs hover:bg-muted cursor-pointer px-2 py-2.5 rounded-sm"
                                          >
                                            <span className="font-medium">{material.name}</span>
                                            <span className="text-[10px] text-blue-500 font-semibold mr-3 bg-blue-50 px-2 py-0.5 rounded">
                                              {material.price.toLocaleString()} تومان
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </div>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {validationErrors.ingredients && (
                    <p className="text-xs text-destructive mt-1 text-right font-medium">{validationErrors.ingredients}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 