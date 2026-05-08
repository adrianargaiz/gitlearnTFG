import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-github-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center" style="background:var(--bg)">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 rounded-full animate-spin"
             style="border:2px solid var(--green);border-top-color:transparent"></div>
        <p class="text-sm" style="color:var(--text2)">Iniciando sesión con GitHub...</p>
      </div>
    </div>
  `,
})
export class GithubCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error || !token) {
      void this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
      return;
    }

    this.authService.loginWithToken(token).subscribe({
      next: (user) => this.authService.redirectByRole(user.rol),
      error: () => void this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } }),
    });
  }
}
