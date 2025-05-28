# Coffee Shop Digital Menu - Svelte Version

This is a Svelte/SvelteKit implementation of a coffee shop digital menu PWA, converted from a React/TypeScript project. The application is designed with a mobile-first approach while ensuring optimization for all devices and resolutions.

## Features

- **PWA Capabilities**: Installable on mobile devices with offline support
- **Mobile-First Design**: Optimized for mobile devices with responsive design for all screen sizes
- **Cart Functionality**: Add, remove, and update items in the cart
- **Internationalization**: Support for multiple languages (English and Spanish)
- **Responsive UI**: Adapts to different screen sizes and orientations
- **Lazy Loading**: Images and components are loaded lazily for better performance

## Tech Stack

- **SvelteKit**: Framework for building Svelte applications
- **TypeScript**: For type safety and better developer experience
- **TailwindCSS**: For styling and responsive design
- **Vite**: Build tool for fast development and optimized production builds
- **PWA**: Progressive Web App capabilities with vite-plugin-pwa
- **svelte-i18n**: For internationalization support

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

Or to run on port 3003:

```bash
npm run start
```

### Building for Production

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
  ├── lib/
  │   ├── components/
  │   │   ├── BottomNav.svelte
  │   │   ├── CartItem.svelte
  │   │   ├── CategoryButton.svelte
  │   │   ├── FoodCard.svelte
  │   │   ├── Header.svelte
  │   │   ├── LazyImage.svelte
  │   │   └── PWAInstallPrompt.svelte
  │   ├── stores/
  │   │   └── cart.ts
  │   ├── data/
  │   │   └── foodData.ts
  │   ├── i18n/
  │   │   ├── index.ts
  │   │   └── locales/
  │   │       ├── en.json
  │   │       └── es.json
  │   └── utils/
  │       └── registerSW.ts
  ├── routes/
  │   ├── +layout.svelte
  │   ├── +page.svelte
  │   ├── menu/
  │   │   └── +page.svelte
  │   ├── food/
  │   │   └── [id]/
  │   │       └── +page.svelte
  │   └── cart/
  │       └── +page.svelte
  └── app.css
```

## License

This project is licensed under the MIT License.
