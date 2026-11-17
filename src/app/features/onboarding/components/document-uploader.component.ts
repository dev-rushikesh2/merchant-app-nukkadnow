import { Component, ChangeDetectionStrategy, input, output, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'merchant-document-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="doc-item-row" [class.uploaded]="uploaded()">
      <div class="doc-icon-badge">
        @if (type() === 'pan') {
          <span class="pan-badge">PAN</span>
        } @else if (type() === 'id') {
          <div class="id-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="3"></rect>
              <circle cx="9" cy="10" r="2"></circle>
              <line x1="15" y1="9" x2="19" y2="9"></line>
              <line x1="15" y1="13" x2="19" y2="13"></line>
              <path d="M6 17c0-2 2-3 3-3s3 1 3 3"></path>
            </svg>
          </div>
        } @else if (type() === 'business') {
          <div class="shop-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        } @else {
          <div class="cert-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2">
              <circle cx="12" cy="8" r="6"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
        }
      </div>

      <div class="doc-text-col">
        <h4 class="doc-title">{{ title() }}</h4>
        <p class="doc-sub">{{ subtitle() }}</p>
        @if (uploaded() && fileName()) {
          <div class="file-tag">
            <span class="file-icon">📄</span>
            <span class="file-name">{{ fileName() }}</span>
            <span class="file-size">({{ fileSize() || '1.5 MB' }})</span>
          </div>
        }
      </div>

      <div class="doc-action-col">
        <input
          #fileInput
          type="file"
          class="hidden-file-input"
          [accept]="accept()"
          (change)="onFileSelected($event)" />

        @if (!uploaded()) {
          <button type="button" class="upload-btn" (click)="triggerFileInput()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            <span>Upload</span>
          </button>
        } @else {
          <div class="uploaded-actions">
            <span class="done-badge">✓ Done</span>
            <button type="button" class="remove-btn" (click)="remove.emit()" title="Remove file">
              ✕
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .doc-item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: #FFFFFF;
      transition: all 0.2s ease;

      &.uploaded {
        border-color: #BBF7D0;
        background: #F0FDF4;
      }
    }

    .doc-icon-badge {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pan-badge {
      font-size: 11px;
      font-weight: 800;
      color: #2563EB;
      background: #DBEAFE;
      padding: 2px 5px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .doc-text-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .doc-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.25;
      margin: 0;
    }

    .doc-sub {
      font-size: 11.5px;
      color: #64748B;
      margin: 2px 0 0 0;
      line-height: 1.3;
    }

    .file-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #DCFCE7;
      color: #15803D;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
      max-width: fit-content;
    }

    .file-name {
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      color: #16A34A;
      font-size: 10px;
    }

    .doc-action-col {
      flex-shrink: 0;
    }

    .hidden-file-input {
      display: none;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 14px;
      border: 1.5px solid #16A34A;
      border-radius: 8px;
      background: #FFFFFF;
      color: #15803D;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #F0FDF4;
        border-color: #15803D;
      }
      &:active {
        transform: scale(0.96);
      }
    }

    .uploaded-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .done-badge {
      font-size: 11.5px;
      font-weight: 700;
      color: #15803D;
      background: #DCFCE7;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .remove-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: #64748B;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #FEE2E2;
        color: #DC2626;
        border-color: #FCA5A5;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentUploaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
  type = input<'pan' | 'id' | 'business' | 'cert'>('pan');
  required = input<boolean>(true);
  uploaded = input<boolean>(false);
  fileName = input<string | undefined>(undefined);
  fileSize = input<string | undefined>(undefined);
  accept = input<string>('.pdf,.jpg,.jpeg,.png');

  fileSelected = output<{ fileName: string; fileSize: string }>();
  remove = output<void>();

  fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  triggerFileInput(): void {
    const inputEl = this.fileInputRef()?.nativeElement;
    if (inputEl) {
      inputEl.click();
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      this.fileSelected.emit({
        fileName: file.name,
        fileSize: `${sizeMb} MB`
      });
    }
  }
}
