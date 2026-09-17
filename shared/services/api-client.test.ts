import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api-client';

const dispatchEvent = vi.fn();
const success = (config: InternalAxiosRequestConfig) => ({ config, data: { id: 'user' }, status: 200, statusText: 'OK', headers: {} });
const unauthorized = (config: InternalAxiosRequestConfig) => Promise.reject(new AxiosError(
  'Unauthorized', undefined, config, undefined, { ...success(config), status: 401 },
));

beforeEach(() => {
  vi.stubGlobal('window', { dispatchEvent, location: { pathname: '/dashboard' } });
  dispatchEvent.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe('session recovery interceptor', () => {
  it('rotates once and retries concurrent requests with the new cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    apiClient.defaults.adapter = vi.fn((config) => (config as InternalAxiosRequestConfig & { _retried?: boolean })._retried
      ? Promise.resolve(success(config)) : unauthorized(config));
    const results = await Promise.all([apiClient.get('/auth/me'), apiClient.get('/auth/me')]);
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('signals logout when refresh is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    apiClient.defaults.adapter = unauthorized;
    await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:unauthorized' }));
  });

  it('does not loop if the retried request remains unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    apiClient.defaults.adapter = unauthorized;
    await expect(apiClient.get('/auth/me')).rejects.toBeInstanceOf(axios.AxiosError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 503])('does not evict a session on refresh status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    apiClient.defaults.adapter = unauthorized;
    await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ response: { status } });
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('does not evict on network errors', async () => {
    const failure = new TypeError('offline');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    apiClient.defaults.adapter = unauthorized;
    await expect(apiClient.get('/auth/me')).rejects.toBe(failure);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
