import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

it('performs one logout and one redirect for concurrent expiry handlers', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
  const replace = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location: { replace } });
  const { forceLogout } = await import('./apply-branding');
  await Promise.all([forceLogout(), forceLogout(), forceLogout()]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledExactlyOnceWith('/auth');
});
