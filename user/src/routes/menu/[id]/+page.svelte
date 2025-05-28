<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import LazyImage from '$lib/components/LazyImage.svelte';
  import Header from '$lib/components/Header.svelte';
  import LiveHeader from '$lib/components/LiveHeader.svelte';

  let product: any = null;
  let loading = true;
  let error = '';

  // گرفتن id از URL
  $: id = $page.params.id;

  // آدرس API
  const API_URL = `http://159.65.206.177:3000/api/recipes?include=ingredients`;

  // آیکون‌های پیشنهادی برای مواد اولیه (بر اساس نام یا دسته)
  const ingredientIcons: Record<string, string> = {
    'شیر': '🥛',
    'قهوه': '☕',
    'شکلات': '🍫',
    'شکر': '🍬',
    'یخ': '🧊',
    'چای': '🍵',
    'آب': '💧',
    'وانیل': '🌼',
    'موز': '🍌',
    'توت فرنگی': '🍓',
    'انبه': '🥭',
    'بادام': '🌰',
    'خامه': '🥛',
    'عسل': '🍯',
    'کارامل': '🍮',
    'دارچین': '🌿',
    'لیمو': '🍋',
    'نعنا': '🌱',
    'آلبالو': '🍒',
    'پودر کاکائو': '🍫',
    'بستنی': '🍦',
    'آب پرتقال': '🍊',
    'آب سیب': '🍏',
    'آب آناناس': '🍍',
    'مارشملو': '🍡',
    // ... موارد بیشتر به دلخواه
  };

  function getIngredientIcon(name: string) {
    // جستجو بر اساس نام ماده اولیه
    for (const key in ingredientIcons) {
      if (name.includes(key)) return ingredientIcons[key];
    }
    return '🥄'; // آیکون پیش‌فرض
  }

  async function fetchProduct() {
    loading = true;
    error = '';
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات محصول');
      const data = await res.json();
      product = data.find((item: any) => String(item.id) === String(id));
      if (!product) throw new Error('محصول مورد نظر یافت نشد');
      
      // ایجاد URL کامل برای تصویر اگر imageUrl وجود داشته باشد
      if (product.imageUrl) {
        console.log(`Found imageUrl for product ${product.id}: ${product.imageUrl}`);
        // بررسی می‌کنیم که آیا آدرس نسبی است یا کامل
        if (product.imageUrl.startsWith('http')) {
          product.image = product.imageUrl;
        } else {
          // ادغام با آدرس سرور برای ساخت آدرس کامل
          product.image = `http://159.65.206.177:3000/${product.imageUrl}`;
        }
        console.log(`Final product image URL: ${product.image}`);
      }
    } catch (e: any) {
      error = e.message || 'خطای ناشناخته';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchProduct();
  });

  // محاسبه کالری کل محصول (در صورت وجود)
  $: totalCalories = product && product.ingredients
    ? product.ingredients.reduce((sum: number, ing: any) => sum + (ing.material?.calories ? ing.material.calories * ing.amount : 0), 0)
    : null;

  // فرمت قیمت
  $: formattedPrice = product ? new Intl.NumberFormat('fa-IR').format(product.finalPrice || product.sellPrice || product.price || 0) : '';
</script>

<LiveHeader />
{#if loading}
  <div class="flex justify-center items-center h-60 text-lg dark:text-dark-text">در حال بارگذاری...</div>
{:else if error}
  <div class="flex justify-center items-center h-60 text-red-500 dark:text-red-300">{error}</div>
{:else if product}
  <div class="product-toolbar">
    <button class="back-btn" on:click={() => history.back()} aria-label="بازگشت">
      <span class="icon">&#8592;</span>
    </button>
    <span class="toolbar-title">{product.name}</span>
  </div>
  <div class="product-page-container">
    <div class="product-image-wrapper">
      <div class="product-image-top-padding"></div>
      <LazyImage src={product.image || 'https://via.placeholder.com/400x400/3A3A3A/E0E0E0?text=No+Image'} alt={product.name} className="product-image" />
    </div>
    <div class="product-content-card">
      <h1 class="product-title">{product.name}</h1>
      <p class="product-desc">{product.description || 'بدون توضیح'}</p>
      <div class="ingredients-section">
        <h2 class="ingredients-title">مواد اولیه</h2>
        <ul class="ingredients-list">
          {#each product.ingredients as ing}
            <li class="ingredient-item">
              <span class="ingredient-dot">{getIngredientIcon(ing.material?.name || '')}</span>
              <span class="ingredient-name">{ing.material?.name || '---'}</span>
            </li>
          {/each}
        </ul>
      </div>
      <div class="flex flex-col items-center mt-6 gap-2">
        {#if totalCalories}
          <div class="calories-badge">کالری کل: <span>{totalCalories}</span> کیلوکالری</div>
        {/if}
        <div class="price-badge">{formattedPrice} <span>تومان</span></div>
      </div>
    </div>
  </div>
{/if}

<style>
.product-toolbar {
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  justify-content: flex-end;
  background: #3A3A3A; /* dark-card-bg */
  border-radius: 0.7rem;
  box-shadow: 0 2px 8px rgba(30,170,160,0.07);
  margin: 0.5rem 1.2rem 1.2rem 1.2rem;
  padding: 0.2rem 0.8rem;
  min-height: 2.2rem;
  position: relative;
  z-index: 10;
}
.toolbar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #E0E0E0; /* dark-text */
  margin-left: 0.7rem;
  flex: 1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.back-btn {
  background: #2C2C2C; /* dark-background */
  border: none;
  border-radius: 0.7rem;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(30,170,160,0.13);
  cursor: pointer;
  font-size: 1.2rem;
  color: #E0E0E0; /* dark-text */
  z-index: 2;
  transition: background 0.2s;
}
.back-btn:hover {
  background: #3A3A3A; /* dark-card-bg */
}
.product-title {
  font-size: 2rem;
  font-weight: bold;
  color: #f03e3e; /* primary-teal */
  text-align: center;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(240,62,62,0.2); /* primary-teal with opacity */
}
.product-page-container {
  max-width: 420px;
  margin: 2.5rem auto 2rem auto;
  background: linear-gradient(135deg, #2C2C2C 60%, #3A3A3A 100%); /* dark-background and dark-card-bg */
  border-radius: 0.7rem;
  box-shadow: 0 8px 32px 0 rgba(30,170,160,0.10), 0 1.5px 8px 0 rgba(30,170,160,0.08);
  overflow: hidden;
  position: relative;
}
.product-image-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  border-top-left-radius: 0.8rem;
  border-top-right-radius: 0.8rem;
  border-bottom-left-radius: 0.8rem;
  border-bottom-right-radius: 0.8rem;
  background-color: #3A3A3A; /* dark-card-bg */
  padding-top: 4px;
  padding-bottom: 0;
  padding-left: 18px;
  padding-right: 18px;
}
.product-image-top-padding {
  height: 0;
}
:global(.product-image) {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  box-shadow: 0 4px 24px 0 rgba(30,170,160,0.10);
  z-index: 1;
  border-top-left-radius: 0.8rem;
  border-top-right-radius: 0.8rem;
}
.product-content-card {
  padding: 2.2rem 1.5rem 1.5rem 1.5rem;
  background: transparent;
  position: relative;
  z-index: 3;
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px 0 rgba(30,170,160,0.06);
}
.product-desc {
  color: #E0E0E0; /* dark-text */
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.7;
  background: rgba(58,58,58,0.25); /* dark-card-bg with opacity */
  border-radius: 0.5rem;
  padding: 0.7rem 1rem;
}
.ingredients-section {
  margin-bottom: 1.5rem;
}
.ingredients-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f03e3e; /* primary red */
  margin-bottom: 0.7rem;
  text-align: right;
}
.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.ingredient-item {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #E0E0E0; /* dark-text */
  background: #3A3A3A; /* dark-card-bg */
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 0.7rem;
  box-shadow: 0 1px 4px 0 rgba(30,170,160,0.04);
  transition: background 0.2s;
}
.ingredient-item:hover {
  background: #2C2C2C; /* dark-background */
}
.ingredient-dot {
  width: 2.1em;
  height: 2.1em;
  font-size: 1.3em;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.7rem;
  margin-right: 0.1rem;
  background: #2C2C2C; /* dark-background */
  border-radius: 0.7rem;
  box-shadow: 0 1px 4px 0 rgba(30,170,160,0.07);
}
.ingredient-name {
  font-weight: 500;
  font-size: 1.08em;
}
.calories-badge {
  background: linear-gradient(90deg, #3A3A3A 0%, #2C2C2C 100%); /* dark-card-bg and dark-background */
  color: #f03e3e; /* primary-teal */
  font-size: 3.5rem;
  font-weight: bold;
  border-radius: 0.6rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  box-shadow: 0 1px 4px 0 rgba(30,170,160,0.07);
}
.price-badge {
  background: linear-gradient(90deg, #f03e3e 0%, #ff6b6b 100%);
  color: #fff;
  font-weight: bold;
  border-radius: 0.6rem;
  padding: 0.7rem 2.2rem;
  font-size: 1.3rem;
  box-shadow: 0 2px 8px 0 rgba(240, 62, 62, 0.2);
  margin-bottom: 0.5rem;
}
</style>
