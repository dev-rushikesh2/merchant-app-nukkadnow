import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthStateService } from '@nukkadnow/auth-client';
import { StaffPermissionStore } from './staff-permission.store';
import { checkUserPermission } from './role-matrix';

/**
 * [merchantHasPermission] structural directive
 *
 * Usage:
 *   <button *merchantHasPermission="'catalog:create_edit'">Add Product</button>
 *
 * Checks permissions in priority order:
 * 1. If staff terminal is active → use StaffPermissionStore.hasPermission()
 * 2. Otherwise → check JWT role via checkUserPermission()
 * Owner (no staff active) always gets true.
 */
@Directive({
  selector: '[merchantHasPermission]',
  standalone: true
})
export class PermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authState = inject(AuthStateService);
  private permStore = inject(StaffPermissionStore);
  private hasView = false;
  private currentPermission: string | null = null;

  @Input() set merchantHasPermission(permission: string) {
    this.currentPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate when auth state or terminal staff changes
      this.authState.user();
      this.permStore.activeTerminalStaff();
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

    let allowed: boolean;

    if (this.permStore.isStaffMode()) {
      // Staff terminal is active — use their custom permissions
      allowed = this.permStore.hasPermission(this.currentPermission);
    } else {
      // Owner mode — check JWT role permissions
      const user = this.authState.user();
      const roles = user?.roles || [];
      allowed = checkUserPermission(roles, this.currentPermission);
    }

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
