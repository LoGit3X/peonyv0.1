<script lang="ts">
  import { goto } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import CartItem from '$lib/components/CartItem.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { cart, totalItems } from '$lib/stores/cart';
  import { t } from '$lib/i18n';
</script>

{#if $totalItems === 0}
  <div class="pb-20 bg-bg-light-mint dark:bg-dark-background min-h-screen flex flex-col items-center justify-center px-4">
    <div class="text-6xl mb-4">🛒</div>
    <h2 class="text-xl font-semibold mb-2 dark:text-dark-text">{$t('cart.empty')}</h2>
    <p class="text-gray-500 dark:text-dark-text text-center mb-6">{$t('cart.emptyMessage')}</p>
    <button
      class="bg-primary-teal text-white px-6 py-3 rounded-xl font-semibold"
      on:click={() => goto('/menu')}
    >
      {$t('cart.browseMenu')}
    </button>
  </div>
{:else}
  <div class="pb-20 bg-bg-light-mint dark:bg-dark-background min-h-screen">
    <Header
      title={$t('cart.title', { values: { count: $totalItems } })}
      showBackButton
    />

    <div class="px-4">
      <!-- Cart Items -->
      <div class="mb-6">
        {#each $cart as item (item.id)}
          <CartItem {item} />
        {/each}
      </div>

      <!-- Note: Removed promo code, order summary, and checkout sections as requested -->

      <!-- Browse Menu Button -->
      <button
        class="w-full bg-primary-teal text-white py-3 rounded-xl font-semibold"
        on:click={() => goto('/menu')}
      >
        {$t('cart.browseMenu')}
      </button>
    </div>
  </div>

  <BottomNav />
{/if}
