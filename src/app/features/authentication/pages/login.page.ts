import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { AuthStateService } from '@nukkadnow/auth-client';

@Component({
  selector: 'merchant-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent implements OnInit {
  authStore = inject(AuthStore);
  authState = inject(AuthStateService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // View Mode defaults to 'splash' for APK launch
  readonly viewMode = signal<'splash' | 'login'>('splash');

  // Email input (initialized empty - no hardcoded PII)
  email = '';
  validationError = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'login') {
        this.viewMode.set('login');
      } else if (this.authState.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      } else {
        this.viewMode.set('splash');
      }
    });
  }

  showLogin() {
    this.viewMode.set('login');
  }

  showSplash() {
    this.viewMode.set('splash');
  }

  onSubmit() {
    const raw = this.email.trim();
    if (!raw) {
      this.validationError.set('Please enter your registered email address');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(raw)) {
      this.validationError.set('Please enter a valid email address (e.g. merchant@patilsabji.com)');
      return;
    }

    this.validationError.set(null);
    this.authStore.sendOtp(raw);
  }
}
