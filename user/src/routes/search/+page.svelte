<script lang="ts">
  import { onMount } from 'svelte';
  import FoodCard from '$lib/components/FoodCard.svelte';
  import { t } from '$lib/i18n';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { goto } from '$app/navigation';
  import LiveHeader from '$lib/components/LiveHeader.svelte';

  let searchQuery = '';
  let searchResults: any[] = [];
  let categoryResults: any[] = [];
  let loading = false;
  let allProducts: any[] = [];

  const API_URL = 'http://159.65.206.177:3000/api/recipes';

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

  // Fetch products from API on mount
  onMount(async () => {
    loading = true;
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات محصولات');
      const data = await res.json();
      allProducts = data.map((item: any) => {
        // ایجاد URL کامل برای تصویر اگر imageUrl وجود داشته باشد
        let imageUrl = null;
        if (item.imageUrl) {
          console.log(`Found imageUrl for search item ${item.id}: ${item.imageUrl}`);
          // بررسی می‌کنیم که آیا آدرس نسبی است یا کامل
          if (item.imageUrl.startsWith('http')) {
            imageUrl = item.imageUrl;
          } else {
            // ادغام با آدرس سرور برای ساخت آدرس کامل
            imageUrl = `http://159.65.206.177:3000/${item.imageUrl}`;
          }
          console.log(`Final search image URL: ${imageUrl}`);
        }

        return {
          id: item.id,
          name: item.name,
          image: imageUrl || item.image || 'https://placehold.co/400x400?text=No+Image',
          description: item.description || '',
          price: item.finalPrice || item.sellPrice || item.price || 0,
          category: item.category,
          ingredients: item.ingredients || []
        };
      });
    } catch (e) {
      // Optionally handle error
    } finally {
      loading = false;
    }
  });

  // جستجو در محصولات و دسته‌بندی‌ها
  $: {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      // جستجو در محصولات (API-fetched only)
      searchResults = allProducts.filter((item: any) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
      // جستجو در دسته‌بندی‌ها
      categoryResults = categories.filter((cat: any) =>
        cat.id !== 'all' && (
          cat.name.toLowerCase().includes(q) ||
          cat.id.toLowerCase().includes(q)
        )
      );
    } else {
      searchResults = [];
      categoryResults = [];
    }
  }

  // آیکون سرچ
  const SearchIcon = () => '🔍';
</script>

<div class="flex-grow pb-24 safe-top bg-white dark:bg-dark-background">
  <LiveHeader />

  <!-- Search Box -->
  <div class="px-4 pt-4 relative z-10 bg-white dark:bg-dark-background">
    <div class="bg-white dark:bg-dark-card-bg rounded-xl shadow-md border border-gray-100 dark:border-dark-background overflow-hidden">
      <div class="flex items-center p-3">
        <input
          type="search"
          class="w-full bg-transparent outline-none text-gray-800 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text text-sm pr-2"
          placeholder="جستجو در منو..."
          bind:value={searchQuery}
          autofocus
        >
        <span class="text-gray-400 dark:text-dark-text ml-2 bg-gray-100 dark:bg-dark-background p-2 rounded-full">{SearchIcon()}</span>
      </div>
    </div>
  </div>

  <!-- نتایج جستجو در دسته‌بندی‌ها -->
  {#if searchQuery.trim().length > 0 && categoryResults.length > 0}
    <div class="px-4 mb-6">
      <h2 class="text-lg font-bold mb-2 text-center text-gray-700 dark:text-dark-text">دسته‌بندی‌های مرتبط</h2>
      <div class="flex flex-row-reverse flex-wrap gap-4 justify-center">
        {#each categoryResults as cat}
          <button
            class="bg-primary-teal/10 text-primary-teal rounded-xl px-5 py-3 font-bold shadow hover:bg-primary-teal/20 transition-all"
            on:click={() => goto(cat.id === 'شیک' ? '/shake' : `/menu?category=${cat.id}`)}
          >
            <span class="text-2xl mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- نتایج جستجو در محصولات -->
  <div class="px-4">
    {#if searchQuery.trim().length > 0}
      <h2 class="text-lg font-bold mb-4 text-center text-gray-700 dark:text-dark-text">نتایج محصولات</h2>
      {#if searchResults.length === 0}
        <div class="text-center py-8 text-gray-500 dark:text-dark-text">موردی یافت نشد</div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each searchResults as item (item.id)}
            <div class="bg-white dark:bg-dark-card-bg rounded-xl overflow-hidden shadow-md relative hover:shadow-lg transition-shadow h-full cursor-pointer"
              on:click={() => goto(`/menu/${item.id}`)}
              tabindex="0"
              role="button"
              on:keydown={(e) => e.key === 'Enter' && goto(`/menu/${item.id}`)}
            >
              <div class="aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} class="w-full h-full object-cover" />
              </div>
              <div class="p-3 text-right">
                <h3 class="font-bold text-sm mb-2 text-gray-800 dark:text-dark-text">{item.name}</h3>
                <div class="flex justify-between items-center">
                  <span class="text-primary-teal font-bold text-sm">{item.price.toLocaleString()} تومان</span>
                </div>
              </div>
              <!-- تگ دسته‌بندی -->
              <div class="absolute top-2 right-2 bg-white/80 dark:bg-dark-card-bg/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 dark:text-dark-text">
                {item.category}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <!-- نوار پایین -->
  <BottomNav />
</div>

<style>
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
</style>
