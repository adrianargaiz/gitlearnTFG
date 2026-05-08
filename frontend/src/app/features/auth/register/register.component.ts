import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['estudiante' as 'estudiante' | 'profesor'],
  });

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly roles = [
    { value: 'estudiante' as const, label: 'Estudiante', desc: 'Aprendo a mi ritmo' },
    { value: 'profesor'   as const, label: 'Profesor',   desc: 'Creo y gestiono lecciones' },
  ];

  setRol(rol: 'estudiante' | 'profesor'): void {
    this.form.controls.rol.setValue(rol);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    const { nombre, email, password, rol } = this.form.getRawValue();
    this.authService.register({ nombre, email, password, rol }).subscribe({
      error: (err: { error?: { message?: string } }) => {
        this.errorMsg.set(err.error?.message ?? 'Error al crear la cuenta. Inténtalo de nuevo.');
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
