import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const request = (token?: string) => new NextRequest('http://localhost/api/auth/refresh', {
  method: 'POST', headers: token ? { cookie: `refresh_token=${token}` } : {},
});

afterEach(() => vi.unstubAllGlobals());

function expectCleared(response: Response) {
  const cookies = response.headers.getSetCookie();
  for (const name of ['access_token', 'refresh_token']) {
    expect(cookies).toContainEqual(expect.stringMatching(new RegExp(`${name}=;.*Path=/;.*Max-Age=0`, 'i')));
  }
}

describe('session refresh', () => {
  it('clears stale cookies even when no refresh token remains', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await POST(request());
    expect(result.status).toBe(401);
    expectCleared(result);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears cookies when the backend rejects the session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const result = await POST(request('expired'));
    expect(result.status).toBe(401);
    expectCleared(result);
  });

  it.each([429, 500, 503])('preserves cookies on backend status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    const result = await POST(request(`status-${status}`));
    expect(result.status).toBe(status);
    expect(result.headers.getSetCookie()).toEqual([]);
  });

  it('handles network rejection and releases the mutex for the next attempt', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request('offline'))).status).toBe(503);
    expect((await POST(request('offline'))).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([200, 503])('shares concurrent refreshes with independent response bodies (%s)', async (status) => {
    let resolve!: (response: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
    vi.stubGlobal('fetch', fetchMock);
    const calls = [POST(request(`concurrent-${status}`)), POST(request(`concurrent-${status}`))];
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Let both callers finish hashing before releasing the shared upstream request.
    await new Promise((done) => setTimeout(done, 30));
    resolve(new Response(JSON.stringify({ message: 'result' }), {
      status, headers: { 'Set-Cookie': 'access_token=new; Path=/; HttpOnly' },
    }));
    const results = await Promise.all(calls);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.status)).toEqual([status, status]);
    expect(await results[0].json()).toEqual(await results[1].json());
    if (status === 200) expect(results[1].headers.get('set-cookie')).toContain('access_token=new');
  });
});
