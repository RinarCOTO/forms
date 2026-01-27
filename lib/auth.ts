/**
 * Authentication utilities
 * These are simple client-side helpers. For production, use a proper auth solution like NextAuth.js
 */

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isAuthenticated') === 'true';
}

export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userEmail');
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userName');
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
}

export function requireAuth(router: any): boolean {
  if (!isAuthenticated()) {
    router.push('/login');
    return false;
  }
  return true;
}
