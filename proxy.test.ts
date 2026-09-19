import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import proxy from './proxy';

type Session = 'none' | 'tenant' | 'admin' | 'both';

const COOKIES: Record<Session, string> = {
  none: '',
  tenant: 'access_token=t',
  admin: 'admin_access_token=a',
  both: 'access_token=t; admin_access_token=a',
};

function visit(pathname: string, session: Session) {
  const request = new NextRequest(`http://localhost${pathname}`, {
    headers: COOKIES[session] ? { cookie: COOKIES[session] } : {},
  });
  const response = proxy(request);
  const location = response.headers.get('location');
  return {
    redirectedTo: location ? new URL(location).pathname : null,
    response,
  };
}

/**
 * The edge is not the authorization boundary — the API is — but it is what
 * decides which shell a URL may load, and it is where the two sessions must
 * stop being interchangeable.
 */
describe('session boundary at the edge', () => {
  it('sends a visitor with only an organization session to the console sign-in', () => {
    // The regression this exists for: before the split, an organization
    // session satisfied /admin outright and the console opened with no
    // further questions.
    expect(visit('/admin', 'tenant').redirectedTo).toBe('/admin/login');
    expect(visit('/admin/organizations', 'tenant').redirectedTo).toBe('/admin/login');
  });

  it('remembers where the visitor was heading', () => {
    const { response } = visit('/admin/plans', 'tenant');
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('callbackUrl')).toBe('/admin/plans');
  });

  it('lets a console session through to the console', () => {
    expect(visit('/admin', 'admin').redirectedTo).toBeNull();
    expect(visit('/admin/users', 'both').redirectedTo).toBeNull();
  });

  it('does not let a console session stand in for an organization session', () => {
    // The split cuts both ways: holding the console does not sign you into
    // the dashboard.
    expect(visit('/dashboard', 'admin').redirectedTo).toBe('/auth');
  });

  it('keeps the console sign-in reachable without a console session', () => {
    expect(visit('/admin/login', 'none').redirectedTo).toBeNull();
    expect(visit('/admin/login', 'tenant').redirectedTo).toBeNull();
  });

  it('skips the console sign-in for someone who already holds one', () => {
    expect(visit('/admin/login', 'admin').redirectedTo).toBe('/admin');
  });

  it('still guards the dashboard and leaves public routes alone', () => {
    expect(visit('/dashboard', 'none').redirectedTo).toBe('/auth');
    expect(visit('/dashboard', 'tenant').redirectedTo).toBeNull();
    expect(visit('/', 'none').redirectedTo).toBeNull();
    expect(visit('/auth', 'none').redirectedTo).toBeNull();
    expect(visit('/terms', 'none').redirectedTo).toBeNull();
  });

  it('bounces an already-signed-in visitor away from the login form', () => {
    // DEFAULT_LANDING is the workspace picker, not a dashboard: which space to
    // open is the user's choice.
    expect(visit('/auth', 'tenant').redirectedTo).toBe('/workspace');
  });
});
