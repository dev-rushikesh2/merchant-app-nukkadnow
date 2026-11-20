import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthFacade } from '../state/auth.facade';
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
  authFacade = inject(AuthFacade);
  authState = inject(AuthStateService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // View Mode defaults to 'splash' for APK launch
  readonly viewMode = signal<'splash' | 'login'>('splash');

  // Form inputs
  phone = '+91 98230 11223';
  password = '';
  rememberMe = true;
  showPassword = signal<boolean>(false);
  validationError = signal<string | null>(null);

  // Carousel indicator for splash
  readonly activeSlide = signal<number>(0);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'login') {
        this.viewMode.set('login');
      } else if (this.authState.isAuthenticated()) {
        // If already authenticated, proceed to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        this.viewMode.set('splash');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  showLogin() {
    this.viewMode.set('login');
  }

  showSplash() {
    this.viewMode.set('splash');
  }

  onSubmit() {
    const raw = this.phone.replace('+91', '').trim();
    if (!raw) {
      this.validationError.set('Please enter your registered mobile number');
      return;
    }

    // Direct routing to verify-otp
    this.router.navigate(['/auth/verify-otp'], { queryParams: { phone: this.phone } });
  }

  loginWithDemoShop(shopType: 'SABJI' | 'KIRANA' | 'SWEETS' | 'DAIRY') {
    const merchants = {
      SABJI: { id: 'merchant-sabji-001', name: 'Patil Fresh Sabji Mandi (Nagpur)' },
      KIRANA: { id: 'merchant-kirana-001', name: 'Sharma Kirana & General Store (Akola)' },
      SWEETS: { id: 'merchant-sweets-001', name: 'Haldiram Mithai Express (Amravati)' },
      DAIRY: { id: 'merchant-dairy-001', name: 'Chitale Bandhu Dairy (Pune)' }
    };
    const selected = merchants[shopType];
    this.authState.setUser({
      id: selected.id,
      phone: '+91 98230 11223',
      name: selected.name,
      roles: ['merchant_owner']
    });
    this.router.navigate(['/dashboard']);
  }

  loginWithWhatsApp() {
    this.router.navigate(['/auth/verify-otp'], { queryParams: { phone: this.phone, channel: 'whatsapp' } });
  }
}
