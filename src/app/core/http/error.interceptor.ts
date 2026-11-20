import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../feedback/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`Merchant API Error [${req.method} ${req.url}]:`, error.status, error.message);

      if (error.status === 401) {
        if (!req.url.includes('/auth/login') && !req.url.includes('/auth/request-otp') && !req.url.includes('/auth/verify-otp')) {
          toast.show('Session expired. Please log in again.', 'error');
          router.navigate(['/auth/login']);
        }
      } else if (error.status === 403) {
        toast.show(error.error?.message || 'Access denied: You do not have permission for this action.', 'error');
      } else if (error.status === 422) {
        toast.show(error.error?.message || 'Validation error: Please review the entered details.', 'warning');
      } else if (error.status >= 500) {
        toast.show('Server temporarily unavailable. Please retry in a moment.', 'error');
      } else if (error.status === 0) {
        toast.show('Network offline or backend gateway unreachable.', 'error');
      }

      return throwError(() => error);
    })
  );
};
