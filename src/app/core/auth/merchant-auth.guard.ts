import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService, TokenStorageService } from '@nukkadnow/auth-client';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export const merchantAuthGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const token = tokenStorage.getAccessToken();

  if (authState.isAuthenticated() && !isTokenExpired(token)) {
    return true;
  }

  // Token missing or expired: clear session and redirect to login
  tokenStorage.clear();
  authState.logout();
  router.navigate(['/auth/login'], { queryParams: { mode: 'login' } });
  return false;
};
