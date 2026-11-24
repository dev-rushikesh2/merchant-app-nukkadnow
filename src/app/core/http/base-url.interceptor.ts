import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prepends the API gateway base URL to every relative request path.
 * Required for Capacitor (Android/iOS): when the app runs as an APK there is
 * no same-origin server, so relative paths like /api/v1/... would fail.
 * Absolute URLs (already starting with http/https) are passed through unchanged.
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }
  const baseUrl = environment.apiGatewayUrl.replace(/\/api\/v1$/, '');
  return next(req.clone({ url: `${baseUrl}${req.url}` }));
};
