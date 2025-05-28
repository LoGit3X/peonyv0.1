<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import CategoryButton from '$lib/components/CategoryButton.svelte';
  import FoodCard from '$lib/components/FoodCard.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import LiveHeader from '$lib/components/LiveHeader.svelte';

  // آدرس سرور ادمین را اینجا تنظیم کنید
  const API_URL = 'http://159.65.206.177:3000/api/recipes';

  let foodItems: any[] = [];
  let loading = true;
  let error = '';
  let searchTerm = '';

  // Get category from URL parameter
  $: activeCategory = $page.url.searchParams.get('category') || 'all';

  // Mapping from Persian category IDs to English category names used in the admin panel
  const categoryToEnglish: Record<string, string> = {
    'شیک': 'Shake',
    'قهوه گرم': 'Hot Coffee',
    'قهوه سرد': 'Ice Coffee',
    'نوشیدنی گرم': 'Hot Bar',
    'نوشیدنی سرد': 'Ice Bar',
    'موکتل': 'Mocktail',
    'اسموتی': 'Smoothie'
  };

  const categories = [
    { id: 'all', name: 'همه', icon: '🍽️' },
    { id: 'شیک', name: 'شیک', icon: '🥤' },
    { id: 'قهوه گرم', name: 'قهوه گرم', icon: '☕' },
    { id: 'قهوه سرد', name: 'قهوه سرد', icon: '🧊' },
    { id: 'نوشیدنی گرم', name: 'نوشیدنی گرم', icon: '🍵' },
    { id: 'نوشیدنی سرد', name: 'نوشیدنی سرد', icon: '🧊' },
    { id: 'موکتل', name: 'موکتل', icon: '🍹' },
    { id: 'اسموتی', name: 'اسموتی', icon: '🥤' },
  ];

  async function fetchRecipes() {
    loading = true;
    error = '';
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات منو');
      const data = await res.json();

      // Map each recipe to a food item format
      foodItems = data.map((item: any) => {
        // Select appropriate image for each category if no image is provided
        let defaultImage = 'https://placehold.co/400x400?text=No+Image';

        if (item.category === 'شیک') {
          defaultImage = 'https://images.unsplash.com/photo-1553787499-6f9133242248?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (item.category === 'قهوه گرم') {
          defaultImage = 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (item.category === 'قهوه سرد') {
          defaultImage = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (item.category === 'دسر') {
          defaultImage = 'https://images.unsplash.com/photo-1618440875944-0547abd74ad1?q=80&w=2067&auto=format&fit=crop&ixlib=rb-4.0.3';
        }

        // ایجاد URL کامل برای تصویر اگر imageUrl وجود داشته باشد
        let imageUrl = null;
        if (item.imageUrl) {
          console.log(`Found imageUrl for item ${item.id}: ${item.imageUrl}`);
          // بررسی می‌کنیم که آیا آدرس نسبی است یا کامل
          if (item.imageUrl.startsWith('http')) {
            imageUrl = item.imageUrl;
          } else {
            // ادغام با آدرس سرور برای ساخت آدرس کامل
            imageUrl = `http://159.65.206.177:3000/${item.imageUrl}`;
          }
          console.log(`Final image URL: ${imageUrl}`);
        }

        return {
          id: item.id,
          name: item.name,
          // اگر imageUrl وجود داشته باشد از آن استفاده می‌کنیم، در غیر این صورت از image یا defaultImage
          image: imageUrl || item.image || defaultImage,
          description: item.description || '',
          price: item.finalPrice || item.sellPrice || item.price || 0,
          category: item.category || 'سایر',
          // Map ingredients to include materialName and unit for display
          ingredients: item.ingredients ? item.ingredients.map((ing: any) => ({
            id: ing.materialId,
            materialName: ing.material?.name || 'ماده اولیه',
            amount: ing.amount || 0,
            unit: 'گرم'
          })) : []
        };
      });

      console.log('Fetched menu items:', foodItems);
    } catch (e: any) {
      console.error('Error fetching recipes:', e);
      error = e.message || 'خطای ناشناخته';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchRecipes();
  });

  // Filter by category and search term
  $: filteredItems = foodItems
    .filter(item => activeCategory === 'all' || item.category === activeCategory || item.category === categoryToEnglish[activeCategory])
    .filter(item =>
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  function setActiveCategory(categoryId: string) {
    goto(`/menu?category=${categoryId}`, { keepFocus: true });
  }
</script>

<div class="flex-grow pb-20 bg-bg-light-mint dark:bg-dark-background min-h-screen">
  <LiveHeader />

  {#if loading}
    <div class="flex justify-center items-center h-40 text-lg dark:text-dark-text">در حال بارگذاری...</div>
  {:else if error}
    <div class="flex justify-center items-center h-40 text-red-500 dark:text-red-300">{error}</div>
  {:else}
    <!-- Search Bar -->
    <div class="px-4 mb-6">
      <div class="flex flex-row-reverse items-center bg-gray-100 dark:bg-dark-background rounded-full p-2 px-4">
        <input
          type="text"
          placeholder={$t('menu.search')}
          class="bg-transparent flex-grow focus:outline-none text-sm pr-2 dark:text-dark-text"
          bind:value={searchTerm}
        />
        <span class="text-gray-400 dark:text-dark-text ml-2">🔍</span>
      </div>
    </div>

    <!-- Categories -->
    <div class="mb-6 py-2 bg-gradient-to-r from-gray-50 dark:from-dark-background to-blue-50/30 dark:to-dark-card-bg/30 rounded-xl mx-4 border border-gray-100 dark:border-dark-background shadow-sm">
      <div class="overflow-x-auto no-scrollbar px-3" style="direction: rtl;">
        <div class="flex flex-row-reverse justify-end gap-6 w-full py-2">
          {#each [...categories].reverse() as category}
            <button
              class="flex flex-col items-center min-w-[90px] p-2 rounded-xl transition-all text-base {activeCategory === category.id ? 'bg-primary-teal/10 text-primary-teal shadow-md scale-105' : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-background'}"
              on:click={() => setActiveCategory(category.id)}
            >
              <span class="text-3xl mb-1">{category.icon}</span>
              <span class="text-sm font-bold text-center whitespace-nowrap">{category.name}</span>
              {#if category.id !== 'all'}
                <span class="text-xs bg-gray-100 dark:bg-dark-background rounded-full px-2 py-0 mt-1 text-gray-500 dark:text-dark-text">
                  {foodItems.filter(item => item.category === category.id || item.category === categoryToEnglish[category.id]).length}
                </span>
              {:else}
                <span class="text-xs bg-gray-100 dark:bg-dark-background rounded-full px-2 py-0 mt-1 text-gray-500 dark:text-dark-text">
                  {foodItems.length}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Category Title and Description -->
    <div class="px-4 mb-4">
      <h2 class="text-lg font-bold text-gray-800 dark:text-dark-text">
        {activeCategory === 'all' ? 'همه محصولات' : categories.find(c => c.id === activeCategory)?.name || activeCategory}
      </h2>
      <p class="text-sm text-gray-600 dark:text-dark-text">
        {#if activeCategory === 'all'}
          مشاهده تمام محصولات کافه
        {:else if activeCategory === 'شیک'}
          انواع شیک‌های خوشمزه با طعم‌های متنوع
        {:else if activeCategory === 'قهوه گرم'}
          انواع قهوه گرم برای لحظات دلنشین
        {:else if activeCategory === 'قهوه سرد'}
          قهوه‌های سرد برای روزهای گرم
        {:else if activeCategory === 'نوشیدنی گرم'}
          نوشیدنی‌های گرم متنوع
        {:else if activeCategory === 'نوشیدنی سرد'}
          نوشیدنی‌های سرد خنک و دلچسب
        {:else if activeCategory === 'موکتل'}
          موکتل‌های خاص با طعم‌های جذاب
        {:else if activeCategory === 'اسموتی'}
          اسموتی‌های سالم و خوشمزه
        {/if}
      </p>
    </div>

    <!-- Filtered Items -->
    <div class="px-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredItems as item}
          <div class="bg-white dark:bg-dark-card-bg p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <FoodCard {item} variant="square" />
          </div>
        {/each}
      </div>

      {#if filteredItems.length === 0}
        <div class="text-center py-8 text-gray-500 dark:text-dark-text">
          <p>موردی برای نمایش وجود ندارد</p>
          {#if searchTerm}
            <p class="mt-2 text-sm">جستجو برای: "{searchTerm}"</p>
            <button
              class="mt-3 text-primary-teal underline"
              on:click={() => searchTerm = ''}
            >
              پاک کردن جستجو
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<BottomNav />
