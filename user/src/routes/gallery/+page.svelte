<script lang="ts">
  import { onMount } from 'svelte';
  import LiveHeader from '$lib/components/LiveHeader.svelte';
  let images: string[] = [];
  let fullscreenImage: string | null = null;

  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 50; // Minimum distance for a swipe to be recognized

  onMount(async () => {
    try {
      const res = await fetch('/gallery/manifest.json');
      if (res.ok) {
        images = await res.json();
      } else {
        images = [];
      }
    } catch (e) {
      images = [];
    }
  });

  function openFullscreen(img: string) {
    fullscreenImage = img;
  }
  function closeFullscreen() {
    fullscreenImage = null;
  }
  function handleThumbKey(e: KeyboardEvent, img: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      openFullscreen(img);
    }
  }

  // Functions for navigating between images
  function showPreviousImage() {
    if (!fullscreenImage || images.length === 0) return;
    const currentIndex = images.indexOf(fullscreenImage);
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    fullscreenImage = images[newIndex];
  }

  function showNextImage() {
    if (!fullscreenImage || images.length === 0) return;
    const currentIndex = images.indexOf(fullscreenImage);
    const newIndex = (currentIndex + 1) % images.length;
    fullscreenImage = images[newIndex];
  }

  function handleFullscreenKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeFullscreen();
    } else if (fullscreenImage && images.length > 0) {
      if (e.key === 'ArrowLeft' || e.key === 'Left') {
        showPreviousImage();
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        showNextImage();
      }
    }
  }

  // Touch handlers for swipe navigation
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchMove(e: TouchEvent) {
    touchEndX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd() {
    if (!fullscreenImage || images.length === 0) return;

    const distance = touchEndX - touchStartX;

    if (distance > minSwipeDistance) {
      // Swiped right (show previous image)
      showPreviousImage();
    } else if (distance < -minSwipeDistance) {
      // Swiped left (show next image)
      showNextImage();
    }

    // Reset touch positions
    touchStartX = 0;
    touchEndX = 0;
  }

</script>

<LiveHeader />
<main class="gallery-mobile">
  <div class="gallery-card">
    <h1 class="gallery-title">گالری تصاویر</h1>
    <p class="gallery-instructions">یکم با حال و هوای کافه پیونی بیشتر آشنا شید</p>
    {#if images.length === 0}
      <div class="gallery-empty">هیچ عکسی یافت نشد.</div>
    {:else}
      <div class="gallery-grid">
        {#each images as img}
          <button
            type="button"
            class="gallery-thumb"
            aria-label="نمایش تصویر در اندازه کامل"
            on:click={() => openFullscreen(img)}
            on:keydown={(e) => handleThumbKey(e, img)}
          >
            <img src={img} alt="" loading="lazy" />
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if fullscreenImage}
    <div 
      class="gallery-fullscreen"
      on:click={closeFullscreen}
      role="dialog" 
      aria-modal="true" 
      tabindex="0" 
      on:keydown={handleFullscreenKey}
      on:touchstart={handleTouchStart} 
      on:touchmove={handleTouchMove}
      on:touchend={handleTouchEnd}
    >
      <img src={fullscreenImage} alt="تصویر بزرگ شده" />
      <!-- Navigation Arrows -->
      <button class="gallery-nav-arrow arrow-left" on:click|stopPropagation={showPreviousImage} aria-label="تصویر قبلی">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="gallery-nav-arrow arrow-right" on:click|stopPropagation={showNextImage} aria-label="تصویر بعدی">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <button class="close-btn" on:click|stopPropagation={closeFullscreen} aria-label="بستن">×</button>
    </div>
  {/if}
</main>

<style>
.gallery-mobile {
  padding: 2.5rem 0 2.5rem 0;
  max-width: 520px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #2C2C2C 60%, #3A3A3A 100%); /* dark-background and dark-card-bg */
}
.gallery-card {
  background: rgba(58,58,58,0.95); /* dark-card-bg with opacity */
  border-radius: 2.2rem;
  box-shadow: 0 8px 32px 0 rgba(30,170,160,0.10), 0 1.5px 8px 0 rgba(30,170,160,0.08);
  margin: 1.2rem 0.7rem 0.7rem 0.7rem;
  padding: 2.2rem 1.2rem 1.5rem 1.2rem;
  position: relative;
  z-index: 2;
}
.gallery-title {
  text-align: center;
  font-size: 1.7rem;
  font-weight: bold;
  color: #E0E0E0; /* dark-text */
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
}
.gallery-instructions {
  text-align: center;
  font-size: 1.08rem;
  color: #E0E0E0; /* dark-text */
  margin-bottom: 1.5rem;
  font-weight: 500;
}
.gallery-empty {
  text-align: center;
  color: #E0E0E0; /* dark-text */
  margin-top: 2.5rem;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 0.5rem;
}
.gallery-thumb {
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(30,170,160,0.10);
  cursor: pointer;
  background: linear-gradient(135deg, #3A3A3A 60%, #2C2C2C 100%); /* dark-card-bg and dark-background */
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
}
.gallery-thumb:focus {
  outline: 2px solid #f03e3e; /* primary-teal */
  box-shadow: 0 0 0 2px #3A3A3A; /* dark-card-bg */
}
.gallery-thumb:hover {
  box-shadow: 0 6px 24px rgba(30,170,160,0.18);
  transform: translateY(-2px) scale(1.04);
  z-index: 3;
}
.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #2C2C2C; /* dark-background */
  display: block;
  border-radius: 1.2rem;
}
.gallery-fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  flex-direction: column;
}

.gallery-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(58, 58, 58, 0.2); /* dark-card-bg with opacity */
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.gallery-nav-arrow:hover {
  opacity: 1;
}

.gallery-nav-arrow svg {
  width: 1.5rem;
  height: 1.5rem;
  stroke: #E0E0E0; /* dark-text */
}

.arrow-left {
  left: 1.5rem;
}

.arrow-right {
  right: 1.5rem;
}

.close-btn {
  position: absolute;
  top: 1.2rem;
  left: 1.2rem;
  background: #3A3A3A; /* dark-card-bg */
  color: #f03e3e; /* primary-teal */
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(30,170,160,0.13);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

@media (max-width: 600px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .gallery-card {
    margin: 0.7rem 0.2rem 0.5rem 0.2rem;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }

  /* Adjust arrow position for smaller screens */
  .gallery-nav-arrow {
    width: 2.5rem;
    height: 2.5rem;
  }
  .arrow-left {
    left: 0.5rem;
  }
  .arrow-right {
    right: 0.5rem;
  }
  .gallery-nav-arrow svg {
    width: 1.2rem;
    height: 1.2rem;
  }
}
</style>