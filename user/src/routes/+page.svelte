<script lang="ts">
  import LazyImage from '$lib/components/LazyImage.svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n';
  import { cart } from '$lib/stores/cart';
  import { onMount } from 'svelte';
  import type { FoodItem } from '$lib/stores/cart';
  import FoodCard from '$lib/components/FoodCard.svelte';
  import LiveHeader from '$lib/components/LiveHeader.svelte';

  // Placeholder icons
  const MenuIcon = () => '☰';
  const SearchIcon = () => '🔍';

  // API URL for fetching real products from the admin system
  const API_URL = 'http://159.65.206.177:3000/api/recipes';

  // Store for all products and special offers
  let allProducts: FoodItem[] = [];
  let specialOffers: FoodItem[] = [];
  let loading = true;
  let error = '';

  // متغیر برای مقدار سرچ
  let searchTerm = '';

  // Mapping from English category names to Persian category names
  const englishToPersian: Record<string, string> = {
    'Shake': 'شیک',
    'Hot Coffee': 'قهوه گرم',
    'Ice Coffee': 'قهوه سرد',
    'Hot Bar': 'نوشیدنی گرم',
    'Ice Bar': 'نوشیدنی سرد',
    'Mocktail': 'موکتل',
    'Smoothie': 'اسموتی'
  };

  // محصولات فیلترشده بر اساس سرچ
  $: filteredProducts =
    searchTerm.trim().length === 0
      ? []
      : allProducts.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );

  // Function to fetch real products from the admin system
  async function fetchProducts() {
    loading = true;
    error = '';
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات محصولات');
      const data = await res.json();

      // Map each recipe to a food item format
      allProducts = data.map((item: any) => {
        // Select appropriate image for each category if no image is provided
        let defaultImage = 'https://placehold.co/400x400?text=No+Image';

        const persianCategory = englishToPersian[item.category] || 'سایر';

        if (persianCategory === 'شیک') {
          defaultImage = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (persianCategory === 'قهوه گرم') {
          defaultImage = 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (persianCategory === 'قهوه سرد') {
          defaultImage = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
        } else if (persianCategory === 'دسر') {
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
          category: persianCategory,
          ingredients: item.ingredients ? item.ingredients.map((ing: any) => ({
            id: ing.materialId,
            materialName: ing.material?.name || 'ماده اولیه',
            amount: ing.amount || 0,
            unit: 'گرم'
          })) : []
        };
      });

      // Generate special offers after fetching products
      getRandomSpecialOffers();

    } catch (e) {
      console.error('Error fetching products:', e);
      error = e instanceof Error ? e.message : 'خطای ناشناخته';
    } finally {
      loading = false;
    }
  }

  // Function to get random special offers
  // Returns 4 random products with no more than one from each category
  function getRandomSpecialOffers() {
    // Create a copy of allProducts to avoid modifying the original
    const items = [...allProducts];

    // Shuffle the array randomly
    items.sort(() => Math.random() - 0.5);

    // Create a map to track selected categories
    const selectedCategories = new Set();
    const offers: FoodItem[] = [];

    // Select items ensuring no more than one from each category
    for (const item of items) {
      // Skip if we already have an item from this category
      if (selectedCategories.has(item.category)) continue;

      // Add this item and mark its category as selected
      offers.push(item);
      selectedCategories.add(item.category);

      // Stop once we have 4 items
      if (offers.length === 4) break;
    }

    specialOffers = offers;
  }

  // Import the SVG files
  import iceCoffeeIcon from '$lib/assets/ice-coffee.svg';
  import iceBarIcon from '$lib/assets/ice-bar.svg';

  const categories = [
    { id: 'all', name: 'همه', icon: '🍽️' },
    { id: 'شیک', name: 'شیک', icon: '🥤' },
    { id: 'قهوه گرم', name: 'قهوه گرم', icon: '☕' },
    { id: 'قهوه سرد', name: 'قهوه سرد', icon: `<img src="${iceBarIcon}" class="w-12 h-12" alt="Ice Coffee" />`, isSvg: true },
    { id: 'نوشیدنی گرم', name: 'نوشیدنی گرم', icon: '🍵' },
    { id: 'نوشیدنی سرد', name: 'نوشیدنی سرد', icon: `<img src="${iceCoffeeIcon}" class="w-12 h-12" alt="Ice Bar" />`, isSvg: true },
    { id: 'موکتل', name: 'موکتل', icon: '🍹' },
    { id: 'اسموتی', name: 'اسموتی', icon: '🥤' },
  ];

  onMount(() => {
    // Fetch products
    fetchProducts();
  });
</script>

<div class="flex-grow pb-24 safe-top">
  <LiveHeader />

  <!-- Search Bar -->
  <div class="px-4 relative z-20 mb-6 mt-4">
    <div class="bg-white dark:bg-dark-card-bg rounded-full shadow-lg">
      <div class="flex flex-row-reverse items-center p-2">
        <input
          type="text"
          placeholder="چه چیزی میل دارید؟"
          class="bg-transparent flex-grow focus:outline-none text-xs pr-2 text-gray-800 dark:text-dark-text"
          bind:value={searchTerm}
        />
        <span class="text-gray-400 dark:text-dark-text ml-2 bg-gray-100 dark:bg-dark-background p-1.5 rounded-full">{SearchIcon()}</span>
      </div>
    </div>
    {#if searchTerm.trim().length > 0}
      <div class="bg-white dark:bg-dark-card-bg rounded-xl shadow-lg mt-2 p-4">
        {#if loading}
          <div class="text-center text-gray-500 dark:text-dark-text">در حال جستجو...</div>
        {:else if filteredProducts.length === 0}
          <div class="text-center text-gray-500 dark:text-dark-text">موردی یافت نشد</div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each filteredProducts as item (item.id)}
              <div
                class="bg-white dark:bg-dark-card-bg rounded-lg overflow-hidden shadow-md relative hover:shadow-lg transition-shadow h-full cursor-pointer"
                on:click={() => goto(`/menu/${item.id}`)}
                tabindex="0"
                role="button"
                on:keydown={(e) => e.key === 'Enter' && goto(`/menu/${item.id}`)}
              >
                <div class="aspect-square overflow-hidden">
                  <LazyImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div class="p-3 text-right">
                  <h3 class="font-bold text-sm mb-2 text-gray-800 dark:text-dark-text">{item.name}</h3>
                  <div class="flex justify-between items-center">
                    <p class="text-primary-teal font-bold text-sm">{item.price.toLocaleString()} تومان</p>
                  </div>
                </div>
                <div class="absolute top-2 right-2 bg-white/80 dark:bg-dark-card-bg/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-medium text-gray-700 dark:text-dark-text">
                  {item.category}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Categories -->
  <div class="mt-16 px-4 relative">
    <div class="relative z-10 text-center mb-8">
      <div class="inline-flex items-center justify-center px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 text-white text-sm font-bold tracking-wide shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 transform hover:-translate-y-0.5">
        <svg class="w-5 h-5 ml-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        دسته‌بندی‌ها
      </div>
    </div>
    
    <!-- Categories Scroll Container -->
    <div class="relative">
      <!-- Categories List -->
      <div class="flex overflow-x-auto no-scrollbar py-3 -mx-2 px-2" style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;">
        {#each categories as category}
          <a
            href={category.id === 'Shake' ? '/shake' : `/menu?category=${category.id}`}
            class="flex-shrink-0 mx-1.5 first:mr-0 last:ml-0 group"
            aria-label={category.name}
          >
            <div class="flex flex-col items-center justify-center w-24 h-28 bg-white dark:bg-dark-card-bg rounded-xl shadow-sm border border-gray-100 dark:border-dark-background transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95">
              <div class="relative w-10 h-10 flex items-center justify-center">
                {#if category.isSvg}
                  <div class="w-10 h-10 flex items-center justify-center">{@html category.icon}</div>
                {:else}
                  <span class="text-4xl transition-transform duration-300 group-hover:scale-110">{category.icon}</span>
                {/if}
                {#if category.id === 'all'}
                  <span class="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-dark-card-bg shadow-sm">
                    {allProducts.length}
                  </span>
                {/if}
              </div>
              <span class="mt-2 text-sm font-medium text-gray-700 dark:text-dark-text text-center px-1">{category.name}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
    
    <!-- Scroll hint for touch devices -->
    <p class="text-xs text-gray-400 dark:text-dark-text text-center mt-2 flex items-center justify-center md:hidden">
      <span class="animate-bounce-x mr-1">👈</span>
      <span>برای دیدن همه دسته‌ها اسکرول کنید</span>
      <span class="animate-bounce-x ml-1" style="animation-delay: 0.2s">👉</span>
    </p>
  </div>

  <!-- Recommended -->
  <div class="mt-16 px-4 relative overflow-hidden">
    <!-- Decorative elements -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-primary-teal/5 rounded-full mix-blend-multiply filter blur-3xl"></div>
    <div class="absolute -bottom-20 -left-10 w-60 h-60 bg-teal-100/30 rounded-full mix-blend-multiply filter blur-3xl"></div>
    
    <!-- Section Header -->
    <div class="relative z-10 text-center mb-8">
      <div class="inline-flex items-center justify-center px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 text-white text-sm font-bold tracking-wide shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 transform hover:-translate-y-0.5">
        <svg class="w-5 h-5 ml-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        پیشنهادهای ویژه
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-between items-center mb-6 relative z-10">
      <button
        on:click={() => { getRandomSpecialOffers(); }}
        class="group flex items-center space-x-1.5 space-x-reverse text-sm font-medium text-primary-teal hover:text-teal-700 transition-colors"
      >
        <span>تغییر پیشنهادات</span>
        <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </button>
      <button
        on:click={() => goto('/menu')}
        class="flex items-center space-x-1.5 space-x-reverse text-sm font-medium text-primary-teal hover:text-teal-700 transition-colors"
      >
        <span>مشاهده همه</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
      </button>
    </div>

    <!-- Offers Grid -->
    <div class="relative z-10">
      {#if loading}
        <div class="flex justify-center items-center h-64">
          <div class="animate-pulse flex flex-col items-center">
            <div class="w-12 h-12 bg-primary-teal/20 rounded-full mb-4"></div>
            <div class="text-gray-500 dark:text-dark-text">در حال بارگذاری پیشنهادات...</div>
          </div>
        </div>
      {:else if error}
        <div class="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
          <svg class="w-12 h-12 text-red-400 dark:text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-800 dark:text-dark-text mb-1">خطا در دریافت اطلاعات</h3>
          <p class="text-gray-500 dark:text-dark-text text-sm">{error}</p>
        </div>
      {:else if specialOffers.length === 0}
        <div class="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-dark-card-bg rounded-xl p-6 text-center">
          <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-800 dark:text-dark-text mb-1">محصولی یافت نشد</h3>
          <p class="text-gray-500 dark:text-dark-text text-sm">هیچ محصولی در این بخش موجود نمی‌باشد</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each specialOffers as item (item.id)}
              <div
                class="relative group rounded-2xl overflow-hidden bg-white dark:bg-dark-card-bg border border-gray-100 dark:border-dark-background h-full flex flex-col"
                on:click|stopPropagation={() => goto(`/menu/${item.id}`)}
                role="button"
                tabindex="0"
                on:keydown|stopPropagation={(e) => e.key === 'Enter' && goto(`/menu/${item.id}`)}
              >
                <!-- Category Badge -->
                <div class="absolute top-3 right-3 z-10">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-teal/90 text-white shadow-md">
                    {item.category || 'دسته‌بندی'}
                  </span>
                </div>
                
                <!-- Image Container with Rounded Corners -->
                <div class="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-gray-50 dark:from-dark-background to-gray-100 dark:to-dark-card-bg rounded-t-2xl">
                  <div class="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      class="h-full w-auto max-w-full object-contain rounded-lg"
                      loading="lazy"
                      decoding="async"
                      width="3456"
                      height="5184"
                      style="aspect-ratio: 2/3;"
                      on:error={(e: Event) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://via.placeholder.com/300x450/3A3A3A/E0E0E0?text=تصویر+موجود+نیست';
                        img.className = 'w-full h-full object-cover rounded-lg';
                      }}
                    />
                  </div>
                  <!-- Gradient Overlay -->
                  <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>             <!-- Product Info -->
                <div class="p-4 flex-1 flex flex-col">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-dark-text mb-2 line-clamp-2 leading-tight">{item.name}</h3>
                  <p class="text-sm text-gray-600 dark:text-dark-text mb-3 line-clamp-2 min-h-[2.5rem]">{item.description || 'توضیحات این محصول در دسترس نیست'}</p>
                  
                  <div class="mt-auto pt-4">
                    <div class="flex items-center justify-center">
                      <span class="text-lg font-extrabold text-primary-teal bg-primary-teal/10 px-3 py-1.5 rounded-lg">
                        {item.price.toLocaleString()} تومان
                      </span>
                    </div>
                  </div>
                </div>
              </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- View All Button (Mobile) -->
    <div class="mt-8 text-center md:hidden">
      <button
        on:click={() => goto('/menu')}
        class="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 dark:border-dark-background text-sm font-medium rounded-lg text-gray-700 dark:text-dark-text bg-white dark:bg-dark-card-bg hover:bg-gray-50 dark:hover:bg-dark-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-teal transition-colors"
      >
        مشاهده همه محصولات
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- Find Us Here Section -->
  <div class="mt-20 px-4 py-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-card-bg dark:to-dark-background rounded-3xl mx-4 mb-8">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8">ما رو میتونید اینجا پیدا کنید</h2>
      
      <div class="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
        <!-- Instagram Button -->
        <a 
          href="https://www.instagram.com/peony__cafe/" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
        >
          <svg class="w-6 h-6 ml-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.415-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.248-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
          </svg>
          اینستاگرام ما
        </a>
        
        <!-- Call Button -->
        <a 
          href="tel:+989357469119" 
          class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
        >
          <svg class="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          تماس با ما
        </a>
      </div>
    </div>
  </div>
</div>
