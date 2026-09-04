import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const canActivateAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    take(1),
    map(user => !!user),
    tap(isAuth => { if (!isAuth) router.navigate(['/auth/login']); })
  );
};
