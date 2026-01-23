import { Component } from '@angular/core'
import { Router, RouterModule, RouterOutlet } from '@angular/router'
import { AuthService } from './auth/auth.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'indumedinapp';
  constructor(private auth: AuthService, private router: Router) {}
  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/auth/login']));
  }
}
