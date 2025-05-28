<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { registerServiceWorker } from '$lib/utils/registerSW';
  import PWAInstallPrompt from '$lib/components/PWAInstallPrompt.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import '$lib/i18n'; // Import i18n setup
  import { t } from '$lib/i18n';

  let isOnline = true;

  onMount(() => {
    // Register service worker
    registerServiceWorker();

    // Set initial online status
    isOnline = navigator.onLine;

    // Monitor online/offline status
    const handleOnline = () => (isOnline = true);
    const handleOffline = () => (isOnline = false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Apply dark class to html element based on system preference
    const applyTheme = () => {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial application
    applyTheme();

    // Listen for changes in system theme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    // Ensure the bottom navigation stays visible
    const ensureNavVisibility = () => {
      const bottomNav = document.querySelector('nav.bottom-nav') as HTMLElement;
      if (bottomNav) {
        bottomNav.style.display = 'flex';
        bottomNav.style.visibility = 'visible';
      }
    };

    // Check visibility periodically
    const intervalId = setInterval(ensureNavVisibility, 500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', applyTheme);
      clearInterval(intervalId);
    };
  });
</script>

<div class="min-h-screen bg-bg-light-mint dark:bg-dark-background font-sans flex flex-col">
  {#if !isOnline}
    <div class="fixed top-0 left-0 right-0 bg-accent-orange text-white text-center py-1 text-xs z-50">
      {$t('app.offline')}
    </div>
  {/if}

  <PWAInstallPrompt />

  <div class="flex-grow pb-16">
    <slot />
  </div>
  
  <BottomNav />
</div>

<style>
  /* Ensure content doesn't overlap with nav bar */
  :global(body) {
    padding-bottom: 60px !important;
    height: auto !important;
    overflow-y: auto !important;
  }

  /* Make sure the bottom nav appears above all other content */
  :global(nav.bottom-nav) {
    z-index: 9999 !important;
    display: flex !important;
    visibility: visible !important;
  }
</style>
