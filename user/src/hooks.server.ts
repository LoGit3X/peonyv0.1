import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response('{}', {
      headers: {
        'content-type': 'application/json',
      },
      status: 200,
    });
  }

  const response = await resolve(event);
  return response;
};