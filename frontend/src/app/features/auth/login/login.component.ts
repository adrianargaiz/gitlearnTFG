import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly oauthError = this.route.snapshot.queryParamMap.get('error') === 'oauth_failed'
    ? 'El inicio de sesión con GitHub falló. Inténtalo de nuevo.'
    : null;

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      error: (err: { error?: { message?: string } }) => {
        this.errorMsg.set(err.error?.message ?? 'Error al iniciar sesión. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  loginWithGitHub(): void {
    this.authService.loginWithGitHub();
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
