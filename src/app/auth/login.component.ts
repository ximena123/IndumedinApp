import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from './auth.service'

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Login</h2>
    <form [formGroup]="form" (ngSubmit)="onLogin()">
      <input formControlName="email" placeholder="Email" type="email" required>
      <input formControlName="password" placeholder="Contraseña" type="password" required>
      <button type="submit" [disabled]="form.invalid">Entrar</button>
      <div *ngIf="error">{{error}}</div>
    </form>
  `
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  error = '';
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onLogin() {
    if (this.form.valid) {
      const { email, password } = this.form.value as { email: string; password: string };
      this.auth.login(email, password).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: err => this.error = 'Credenciales incorrectas'
      });
    }
  }
}
