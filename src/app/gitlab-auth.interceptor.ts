import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GitlabAuthService } from './services/gitlab-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { IGitlabTokenResponse } from './interfaces/gitlab/igitlab-token-response';

export const GITLAB_REQUEST_HEADER = new HttpContextToken<boolean>(() => false);

//http interceptor qui refresh le token gitlab lorsqu'il n'est plus valide
//attention: pour qu'il soit utilisé, il faut ajouter le contexte GITLAB_REQUEST_HEADER dans la requête http
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
          }),
        );
      }
      return throwError(() => new Error(error.message));
    }),
  );
};
