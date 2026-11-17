import { Injectable, signal, computed, inject } from '@angular/core';
import { NotificationItem, NotificationPreferences } from '../models/notifications-view.model';
import { AudioAlertService } from '../../../core/realtime/audio-alert.service';

@Injectable()
export class NotificationsStore {
  private audio = inject(AudioAlertService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly preferences = signal<NotificationPreferences>({
    soundChimeEnabled: true,
    pushNotificationsEnabled: true,
    smsCustomerAlerts: true,
    highPriorityOrderChime: true
  });

  readonly unreadCount = computed(() => {
    return this.notifications().filter(n => !n.isRead).length;
  });

  markRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllRead(): void {
    this.notifications.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
  }

  testChime(): void {
    this.audio.playNewOrderChime();
  }

  toggleSound(): void {
    this.preferences.update(p => ({ ...p, soundChimeEnabled: !p.soundChimeEnabled }));
  }

  togglePush(): void {
    this.preferences.update(p => ({ ...p, pushNotificationsEnabled: !p.pushNotificationsEnabled }));
  }

  pushNotification(item: NotificationItem): void {
    this.notifications.update(list => [item, ...list]);
    if (this.preferences().soundChimeEnabled) {
      this.audio.playNewOrderChime();
    }
  }
}
