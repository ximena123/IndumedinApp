import { Injectable, NgZone, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { runInZone } from '../shared/run-in-zone.operator';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private zone = inject(NgZone);

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password).then(res => res.user)).pipe(
      runInZone(this.zone),
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(runInZone(this.zone));
  }

  /**
   * Estado de sesión. `onAuthStateChanged` es un callback de Firebase que emite
   * FUERA de la zona de Angular. Como el guard de rutas depende de este
   * observable, sin `runInZone` la navegación (y por tanto la creación del
   * componente y el registro de sus listeners de clic) ocurre fuera de la zona,
   * y los clics dejan de disparar la detección de cambios.
   */
  get user$(): Observable<User | null> {
    return new Observable<User | null>(sub => onAuthStateChanged(this.auth, sub)).pipe(
      runInZone(this.zone),
    );
  }
}
