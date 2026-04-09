import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type AppSyncSource = 'push' | 'resume' | 'manual' | 'navigation';

export type AppSyncEventType =
  | 'global_refresh'
  | 'enrollment_changed'
  | 'renewal_changed'
  | 'notification_changed'
  | 'dashboard_changed'
  | 'tabs_visibility_changed';

export interface AppSyncEvent {
  type: AppSyncEventType;
  source: AppSyncSource;
  enrollmentId?: number;
  renewalId?: number;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class AppSyncService {
  private readonly eventsSubject = new Subject<AppSyncEvent>();
  private readonly dedupeWindowMs = 800;
  private readonly lastEventByKey = new Map<string, number>();

  readonly events$: Observable<AppSyncEvent> = this.eventsSubject.asObservable();

  emit(event: Omit<AppSyncEvent, 'timestamp'>, cooldownMs = this.dedupeWindowMs): void {
    const now = Date.now();
    const syncEvent: AppSyncEvent = {
      ...event,
      timestamp: now,
    };

    const key = this.getDedupeKey(syncEvent);
    const previous = this.lastEventByKey.get(key) ?? 0;
    if (now - previous < cooldownMs) {
      return;
    }

    this.lastEventByKey.set(key, now);
    this.eventsSubject.next(syncEvent);
  }

  emitGlobalRefresh(source: AppSyncSource, cooldownMs = 1200): void {
    this.emit({ type: 'global_refresh', source }, cooldownMs);
  }

  emitFromNotificationData(rawData: unknown): void {
    const data = this.asRecord(rawData);
    const type = this.normalizeString(data?.['type']);
    const enrollmentId = this.toOptionalNumber(data?.['enrollment_id']);
    const renewalId = this.toOptionalNumber(data?.['renewal_id']);

    this.emit(
      {
        type: 'notification_changed',
        source: 'push',
        enrollmentId,
        renewalId,
      },
      500
    );

    if (type.startsWith('enrollment_') || enrollmentId !== undefined) {
      this.emit(
        {
          type: 'enrollment_changed',
          source: 'push',
          enrollmentId,
        },
        700
      );
      this.emit(
        {
          type: 'dashboard_changed',
          source: 'push',
          enrollmentId,
        },
        700
      );
      this.emit(
        {
          type: 'tabs_visibility_changed',
          source: 'push',
          enrollmentId,
        },
        700
      );
    }

    if (type.startsWith('renewal_') || renewalId !== undefined) {
      this.emit(
        {
          type: 'renewal_changed',
          source: 'push',
          renewalId,
        },
        700
      );
      this.emit(
        {
          type: 'dashboard_changed',
          source: 'push',
          renewalId,
        },
        700
      );
    }
  }

  private getDedupeKey(event: AppSyncEvent): string {
    return [event.type, event.enrollmentId ?? '', event.renewalId ?? ''].join(':');
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private normalizeString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().toLowerCase();
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }
}
