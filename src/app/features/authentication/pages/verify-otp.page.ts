import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { AuthStateService } from '@nukkadnow/auth-client';

@Component({
  selector: 'merchant-verify-otp-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.page.html',
  styleUrls: ['./verify-otp.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyOtpPageComponent implements OnInit, OnDestroy {
  authStore = inject(AuthStore);
  authState = inject(AuthStateService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email = signal<string>('');
  digits = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal<number>(30);
  validationError = signal<string | null>(null);
  private timer: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'] || params['phone'] || this.authStore.identifier() || '';
      if (emailParam) {
        this.email.set(emailParam);
        this.authStore.setIdentifier(emailParam);
      }
    });

    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startCountdown() {
    this.countdown.set(30);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.countdown() > 0) {
        this.countdown.update(c => c - 1);
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    const current = [...this.digits()];

    if (val && val.length > 0) {
      current[index] = val.slice(-1);
      this.digits.set(current);
      // Auto focus next input
      if (index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    } else {
      current[index] = '';
      this.digits.set(current);
    }

    // Auto verify if all 6 digits entered
    if (current.every(d => d.length === 1)) {
      this.verifyAndContinue();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  resendOtp() {
    if (this.countdown() === 0 && !this.authStore.loading()) {
      this.authStore.resendOtp();
      this.startCountdown();
    }
  }

  changeEmail() {
    this.router.navigate(['/auth/login']);
  }

  verifyAndContinue() {
    const code = this.digits().join('').trim();
    if (code.length < 6) {
      this.validationError.set('Please enter all 6 digits of the OTP');
      return;
    }

    this.validationError.set(null);
    this.authStore.verifyOtp(code);
  }
}
