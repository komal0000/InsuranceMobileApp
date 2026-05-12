import { EMPTY, Subject, of } from 'rxjs';
import { NotificationsPage } from './notifications.page';

describe('NotificationsPage', () => {
  function makePage(response$: any = of({
    success: true,
    data: { data: [], last_page: 1 },
  })) {
    const api = jasmine.createSpyObj('ApiService', ['get', 'post']);
    api.get.and.returnValue(response$);
    api.post.and.returnValue(of({ success: true }));
    const pushService = jasmine.createSpyObj('PushNotificationService', [
      'fetchUnreadCount',
      'decrementUnread',
      'resetUnread',
    ]);
    const dateService = jasmine.createSpyObj('DateService', ['formatDateTimeForDisplay']);
    dateService.formatDateTimeForDisplay.and.returnValue('2081-01-01');
    const languageService = {
      t: (key: string) => key,
    };

    const page = new NotificationsPage(
      api,
      { events$: EMPTY } as any,
      pushService,
      dateService,
      languageService as any
    );

    return { page, api, pushService };
  }

  it('sets full loading during the first notification load', () => {
    const pending = new Subject<any>();
    const { page, api } = makePage(pending.asObservable());

    page.ngOnInit();

    expect(page.loading).toBeTrue();
    expect(api.get).toHaveBeenCalledWith('/notifications', { page: 1 });
  });

  it('refreshes silently on tab re-entry when cached notifications exist', () => {
    const pending = new Subject<any>();
    const { page, api, pushService } = makePage(pending.asObservable());
    page.notifications = [
      { id: 4, title: 'Policy', message: 'Updated', is_read: true } as any,
    ];

    page.ionViewWillEnter();
    api.get.calls.reset();
    pushService.fetchUnreadCount.calls.reset();
    page.ionViewWillEnter();

    expect(api.get).toHaveBeenCalledWith('/notifications', { page: 1 });
    expect(pushService.fetchUnreadCount).toHaveBeenCalled();
    expect(page.loading).toBeFalse();
    expect(page.notifications).toEqual([
      { id: 4, title: 'Policy', message: 'Updated', is_read: true } as any,
    ]);
  });

  it('pull-to-refresh fetches fresh notifications and completes the refresher', () => {
    const { page, api, pushService } = makePage(of({
      success: true,
      data: {
        data: [{ id: 5, title: 'New', message: 'Ready', is_read: false }],
        last_page: 1,
      },
    }));
    const event = {
      target: jasmine.createSpyObj('Refresher', ['complete']),
    };

    page.refresh(event);

    expect(api.get).toHaveBeenCalledWith('/notifications', { page: 1 });
    expect(page.notifications).toEqual([
      { id: 5, title: 'New', message: 'Ready', is_read: false } as any,
    ]);
    expect(pushService.fetchUnreadCount).toHaveBeenCalled();
    expect(event.target.complete).toHaveBeenCalled();
  });
});
