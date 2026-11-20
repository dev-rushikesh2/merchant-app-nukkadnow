import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthStateService } from '@nukkadnow/auth-client';
import { checkUserPermission } from './role-matrix';

@Directive({
  selector: '[merchantHasPermission]',
  standalone: true
})
export class PermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authState = inject(AuthStateService);
  private hasView = false;
  private currentPermission: string | null = null;

  @Input() set merchantHasPermission(permission: string) {
    this.currentPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever user roles or auth state updates
      this.authState.user();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.currentPermission) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
      return;
    }

    const user = this.authState.user();
    const roles = user?.roles || [];
    const allowed = checkUserPermission(roles, this.currentPermission);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
