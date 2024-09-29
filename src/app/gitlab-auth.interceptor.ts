import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GitlabAuthService } from './services/gitlab-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { IGitlabTokenResponse } from './interfaces/gitlab/igitlab-token-response';

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

  //TODO: trouvr une solution pour refresh sur une autre page que la racine (400 bad request etc etc)

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        return authService.refreshAccessToken().pipe(
          switchMap((newToken: IGitlabTokenResponse) => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken.access_token}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => new Error(refreshError.message));
          })
        );
      }
      return throwError(() => new Error(error.message));
    })
  );
};
