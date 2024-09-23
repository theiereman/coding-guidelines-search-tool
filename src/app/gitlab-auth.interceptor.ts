import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GitlabAuthService } from './services/gitlab-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const GITLAB_REQUEST_HEADER = new HttpContextToken<boolean>(() => false);

export const gitlabAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(GITLAB_REQUEST_HEADER)) {
    return next(req);
  }

  const authService = inject(GitlabAuthService);

  const accessToken = authService.getAccessToken();
  let authReq = req;

  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        return authService.refreshAccessToken().pipe(
          switchMap((newToken: string) => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => new Error(refreshError));
          })
        );
      }
      return throwError(() => new Error(error.message));
    })
  );
};
