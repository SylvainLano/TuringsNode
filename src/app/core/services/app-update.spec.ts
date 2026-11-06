import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { AppUpdateService } from './app-update';

@Component({ template: '' })
class EmptyPage {}

describe('AppUpdateService', () => {
  const versionUpdates = new Subject<VersionEvent>();
  let service: AppUpdateService;
  let router: Router;
  let reloadTo: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'levels', component: EmptyPage }, { path: 'game', component: EmptyPage }]),
        { provide: APP_BASE_HREF, useValue: '/TuringsNode/' },
        { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates, unrecoverable: new Subject() } }
      ]
    });
    service = TestBed.inject(AppUpdateService);
    router = TestBed.inject(Router);
    reloadTo = vi.fn<(url: string) => void>();
    service.reloadTo = reloadTo;
    service.start();
  });

  it('keeps the page as it is while no new version is ready', async () => {
    await router.navigateByUrl('/levels');
    expect(reloadTo).not.toHaveBeenCalled();
  });

  it('installs a downloaded version at the next change of page, by reloading that page', async () => {
    versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } });
    await router.navigateByUrl('/game');
    expect(reloadTo).toHaveBeenCalledWith('/TuringsNode/game');
  });
});

describe('AppUpdateService without a service worker', () => {
  it('does nothing in development and in the tests', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect(() => TestBed.inject(AppUpdateService).start()).not.toThrow();
  });
});
