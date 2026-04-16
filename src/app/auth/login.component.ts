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
    <div class="d-flex justify-content-center align-items-center" style="min-height: 80vh;">
      <div class="card shadow-lg border-0" style="width: 100%; max-width: 420px;">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <i class="fa-solid fa-scissors fa-2x text-dark mb-2"></i>
            <h3 class="fw-bold mb-1">Indumedin</h3>
            <p class="text-muted small">Ingresa a tu cuenta</p>
          </div>
          <form [formGroup]="form" (ngSubmit)="onLogin()">
            <div class="mb-3">
              <label class="form-label">Correo electronico</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fa-solid fa-envelope"></i></span>
                <input formControlName="email" type="email" class="form-control" placeholder="correo@ejemplo.com" required>
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label">Contrasena</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fa-solid fa-lock"></i></span>
                <input formControlName="password" type="password" class="form-control" placeholder="Tu contrasena" required>
              </div>
            </div>
            <button type="submit" class="btn btn-dark w-100 py-2" [disabled]="form.invalid">
              <i class="fa-solid fa-right-to-bracket me-2"></i>Entrar
            </button>
            <div *ngIf="error" class="alert alert-danger mt-3 mb-0 py-2 text-center small">
              <i class="fa-solid fa-circle-exclamation me-1"></i>{{error}}
            </div>
          </form>
        </div>
      </div>
    </div>
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
