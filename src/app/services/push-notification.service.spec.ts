import { NgZone } from '@angular/core';
import { of } from 'rxjs';
import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let api: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<any>;
  let syncService: jasmine.SpyObj<any>;
  let service: PushNotificationService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);
    api.get.and.returnValue(of({ success: true, data: { unread_count: 4 } }));
    api.post.and.returnValue(of({ success: true }));
    api.delete.and.returnValue(of({ success: true }));
    router = jasmine.createSpyObj('Router', ['navigate']);
    syncService = jasmine.createSpyObj('AppSyncService', ['emitFromNotificationData']);

    service = new PushNotificationService(
      api,
      router,
      { run: (callback: () => void) => callback() } as NgZone,
      syncService,
    );
  });

  it('marks the stored notification read when a push alert is tapped', () => {
    (service as any).handleNotificationAction({
      notification_id: '42',
      enrollment_id: 7,
    });

    expect(api.post).toHaveBeenCalledWith('/notifications/42/read', {});
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(syncService.emitFromNotificationData).toHaveBeenCalledWith({
      notification_id: '42',
      enrollment_id: 7,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/enrollment-detail', 7]);
  });

  it('does not post a read request when a tapped push alert has no notification id', () => {
    (service as any).handleNotificationAction({
      renewal_id: 9,
    });

    expect(api.post).not.toHaveBeenCalledWith(jasmine.stringMatching(/^\/notifications\/.+\/read$/), {});
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(router.navigate).toHaveBeenCalledWith(['/renewal-detail', 9]);
  });
});
