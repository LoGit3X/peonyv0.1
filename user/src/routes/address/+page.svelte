<script lang="ts">
  import LiveHeader from '$lib/components/LiveHeader.svelte';
  // صفحه آدرس
</script>

<div class="flex-grow pb-24 safe-top">
  <LiveHeader />

  <!-- Address Section -->
  <div class="px-4 mt-8 flex flex-col items-center">
    <div class="bg-white dark:bg-dark-card-bg rounded-2xl shadow-lg p-6 w-full max-w-2xl">
      <h2 class="text-xl font-bold mb-6 text-primary-teal text-center">آدرس کافه پیونی</h2>

      <!-- Map -->
      <div class="w-full mb-6 overflow-hidden rounded-lg shadow-md">
        <iframe title="map-iframe" src="https://neshan.org/maps/iframe/places/4e8e042195f85d5d379c3eb9cb5ba8a1#c36.317-59.494-17z-0p/36.31719481167812/59.49250656401048" width="100%" height="350" allowFullScreen loading="lazy" style="border: none;"></iframe>
      </div>

      <!-- Text Address -->
      <div class="mb-6 text-center text-gray-700 dark:text-dark-text flex items-center justify-center space-x-2 space-x-reverse">
        <!-- Location Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-base leading-relaxed">
          ایران ، خراسان رضوی ، مشهد، بلوار هفت تیر، بین هفت تیر 28 و 30 (محله‌ی نیروی هوایی)
        </p>
      </div>

      <!-- Navigation Button -->
      <a href="https://nshn.ir/4e_b1-VgyJBBWH" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center space-x-2 space-x-reverse w-full bg-primary-teal text-white py-3 px-6 rounded-lg shadow-md hover:bg-teal-600 transition-colors duration-300 text-lg font-medium">
        <!-- Navigation Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span>مسیریابی با نشان</span>
      </a>
    </div>
  </div>
</div>
