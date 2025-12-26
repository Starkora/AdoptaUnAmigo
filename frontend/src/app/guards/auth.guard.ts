import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take, timeout } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar hasta que currentUser$ emita un valor definido (null o User, pero no undefined)
  return authService.currentUser$.pipe(
    filter(user => user !== undefined), // Esperar a que se complete la verificación
    take(1),
    timeout(3000), // Máximo 3 segundos de espera
    map(user => {

      if (user) {
        return true;
      }
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};

export const rescuerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar hasta que currentProfile$ emita un valor definido
  return authService.currentProfile$.pipe(
    filter(profile => profile !== undefined),
    take(1),
    timeout(3000),
    map(profile => {

      if (profile && profile.role === 'rescatista') {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};

export const adopterGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar hasta que currentProfile$ emita un valor definido
  return authService.currentProfile$.pipe(
    filter(profile => profile !== undefined),
    take(1),
    timeout(3000),
    map(profile => {

      if (profile && profile.role === 'adoptante') {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};
