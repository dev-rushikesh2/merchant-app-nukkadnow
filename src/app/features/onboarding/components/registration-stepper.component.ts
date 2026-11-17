import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepItem {
  stepNumber: number;
  label: string;
}

@Component({
  selector: 'merchant-registration-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (mode() === 'registration') {
      <nav class="stepper-track-wrap" aria-label="Registration Progress">
        <div class="stepper-nodes-row">
          @for (item of steps(); track item.stepNumber; let idx = $index; let last = $last) {
            <!-- Step Node -->
            <div
              class="step-node"
              [class.completed]="isCompleted(item.stepNumber)"
              [class.active]="isActive(item.stepNumber)"
              (click)="stepClick(item.stepNumber)"
              role="button"
              [attr.tabindex]="isCompleted(item.stepNumber) ? 0 : -1">
              
              <div class="node-circle">
                @if (isCompleted(item.stepNumber)) {
                  <svg viewBox="0 0 24 24" class="check-svg" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                } @else {
                  <span>{{ item.stepNumber }}</span>
                }
              </div>

              <span class="node-label">{{ item.label }}</span>
            </div>

            <!-- Connector bar -->
            @if (!last) {
              <div class="connector-line" [class.filled]="isCompleted(item.stepNumber)"></div>
            }
          }
        </div>
      </nav>
    } @else if (mode() === 'status') {
      <!-- 4-Stage Application Status Timeline -->
      <nav class="status-timeline-wrap" aria-label="Application Status Timeline">
        <div class="timeline-row">
          <!-- 1. Submitted -->
          <div class="timeline-node" [class.completed]="statusProgress() >= 1" [class.active]="statusProgress() === 1">
            <div class="status-circle" [class.filled]="statusProgress() >= 1">
              <svg viewBox="0 0 24 24" class="check-svg" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="timeline-title">Submitted</span>
            <span class="timeline-sub">{{ submittedTimestamp() }}</span>
          </div>

          <div class="timeline-bar" [class.filled]="statusProgress() >= 2"></div>

          <!-- 2. Under Review -->
          <div class="timeline-node" [class.completed]="statusProgress() > 2" [class.active]="statusProgress() === 2">
            <div class="status-circle active-ring" [class.filled]="statusProgress() > 2">
              @if (statusProgress() > 2) {
                <svg viewBox="0 0 24 24" class="check-svg" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              } @else {
                <div class="inner-pulse-dot"></div>
              }
            </div>
            <span class="timeline-title" [class.active-text]="statusProgress() === 2">Under Review</span>
            <span class="timeline-sub green-sub">In Progress</span>
          </div>

          <div class="timeline-bar" [class.filled]="statusProgress() >= 3"></div>

          <!-- 3. Approved -->
          <div class="timeline-node" [class.completed]="statusProgress() >= 3" [class.active]="statusProgress() === 3">
            <div class="status-circle" [class.filled]="statusProgress() >= 3">
              @if (statusProgress() >= 3) {
                <svg viewBox="0 0 24 24" class="check-svg" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            </div>
            <span class="timeline-title">Approved</span>
          </div>

          <div class="timeline-bar" [class.filled]="statusProgress() >= 4"></div>

          <!-- 4. Active -->
          <div class="timeline-node" [class.completed]="statusProgress() >= 4" [class.active]="statusProgress() === 4">
            <div class="status-circle" [class.filled]="statusProgress() >= 4">
              @if (statusProgress() >= 4) {
                <svg viewBox="0 0 24 24" class="check-svg" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            </div>
            <span class="timeline-title">Active</span>
          </div>
        </div>
      </nav>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .stepper-track-wrap {
      padding: 8px 12px 16px;
      width: 100%;
    }

    .stepper-nodes-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: relative;
    }

    .step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      cursor: default;
      position: relative;
      z-index: 2;
      flex-shrink: 0;

      &.completed {
        cursor: pointer;
      }
    }

    .node-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #F1F5F9;
      border: 1.5px solid #CBD5E1;
      color: #64748B;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .step-node.active .node-circle {
      background: #15803D;
      border-color: #15803D;
      color: #FFFFFF;
      box-shadow: 0 0 0 4px #DCFCE7;
    }

    .step-node.completed .node-circle {
      background: #15803D;
      border-color: #15803D;
      color: #FFFFFF;
    }

    .check-svg {
      width: 16px;
      height: 16px;
      stroke: #FFFFFF;
    }

    .node-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      text-align: center;
      white-space: nowrap;
    }

    .step-node.active .node-label {
      color: #15803D;
      font-weight: 700;
    }

    .step-node.completed .node-label {
      color: #15803D;
    }

    .connector-line {
      flex: 1;
      height: 2px;
      background: #E2E8F0;
      margin: 0 4px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
      transition: background-color 0.25s ease;

      &.filled {
        background: #15803D;
      }
    }

    /* Status Timeline */
    .status-timeline-wrap {
      padding: 12px 14px 18px;
      width: 100%;
    }

    .timeline-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
      width: 100%;
    }

    .timeline-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 2;
      width: 68px;
    }

    .status-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #F1F5F9;
      border: 2px solid #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;

      &.filled {
        background: #15803D;
        border-color: #15803D;
        color: #FFFFFF;
      }

      &.active-ring {
        background: #FFFFFF;
        border: 2.5px solid #16A34A;
        box-shadow: 0 0 0 4px #DCFCE7;
      }
    }

    .inner-pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #16A34A;
    }

    .timeline-title {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      line-height: 1.2;
    }

    .timeline-title.active-text {
      color: #15803D;
    }

    .timeline-sub {
      font-size: 9.5px;
      color: #64748B;
      margin-top: 2px;
      font-weight: 500;
    }

    .timeline-sub.green-sub {
      color: #16A34A;
      font-weight: 600;
    }

    .timeline-bar {
      flex: 1;
      height: 2.5px;
      background: #E2E8F0;
      margin-top: 15px;
      margin-left: -6px;
      margin-right: -6px;
      z-index: 1;

      &.filled {
        background: #16A34A;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationStepperComponent {
  mode = input<'registration' | 'status'>('registration');
  currentStep = input<number>(1);
  statusProgress = input<number>(2); // 1: Submitted, 2: Under Review, 3: Approved, 4: Active
  submittedTimestamp = input<string>('15 Nov, 10:24 AM');

  stepSelected = output<number>();

  readonly steps = input<StepItem[]>([
    { stepNumber: 1, label: 'Business Type' },
    { stepNumber: 2, label: 'Details' },
    { stepNumber: 3, label: 'Location' },
    { stepNumber: 4, label: 'Setup' },
    { stepNumber: 5, label: 'Verify' }
  ]);

  isCompleted(stepNum: number): boolean {
    const cur = this.currentStep();
    if (cur === 7) return true; // Review step means 1..6 are all completed!
    if (stepNum === 1 && cur > 1) return true;
    if (stepNum === 2 && cur > 2) return true;
    if (stepNum === 3 && cur > 3) return true;
    if (stepNum === 4 && cur > 5) return true; // Steps 4 (Hours) and 5 (Fulfilment) fall under Setup
    if (stepNum === 5 && cur > 6) return true;
    return false;
  }

  isActive(stepNum: number): boolean {
    const cur = this.currentStep();
    if (cur === 7 && stepNum === 7) return true;
    if (stepNum === 1 && cur === 1) return true;
    if (stepNum === 2 && cur === 2) return true;
    if (stepNum === 3 && cur === 3) return true;
    if (stepNum === 4 && (cur === 4 || cur === 5)) return true;
    if (stepNum === 5 && cur === 6) return true;
    return false;
  }

  stepClick(stepNum: number): void {
    if (this.isCompleted(stepNum)) {
      // Map back to internal step
      if (stepNum === 1) this.stepSelected.emit(1);
      else if (stepNum === 2) this.stepSelected.emit(2);
      else if (stepNum === 3) this.stepSelected.emit(3);
      else if (stepNum === 4) this.stepSelected.emit(4);
      else if (stepNum === 5) this.stepSelected.emit(6);
    }
  }
}
