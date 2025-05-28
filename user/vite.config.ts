import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
			manifest: {
				name: 'منوی دیجیتال',
				short_name: 'منوی دیجیتال',
				description: 'منوی دیجیتال با طراحی اولویت موبایل',
				theme_color: '#2DC8B9',
				background_color: '#F0FAF9',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{
						src: '/icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	],
	server: {
		host: '0.0.0.0',
		port: 3003,
		strictPort: true,
		hmr: {
			host: 'localhost',
			port: 3003
		}
	}
});
