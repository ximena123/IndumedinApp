import { Injectable, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password).then(res => res.user));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  get user$(): Observable<User | null> {
    return new Observable(sub => onAuthStateChanged(this.auth, sub));
  }
}
