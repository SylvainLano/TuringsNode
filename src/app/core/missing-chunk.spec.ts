import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NavigationError, provideRouter } from '@angular/router';
import { reloadOnMissingChunk } from './missing-chunk';

describe('reloadOnMissingChunk', () => {
  const missing = new NavigationError(1, '/achievements', new TypeError('Failed to fetch dynamically imported module: /chunk-old.js'));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: APP_BASE_HREF, useValue: '/TuringsNode/' }] });
    sessionStorage.removeItem('turings_node_reloaded_at');
  });

  afterEach(() => sessionStorage.removeItem('turings_node_reloaded_at'));

  const handle = (error: NavigationError, reload: (url: string) => void) =>
    TestBed.runInInjectionContext(() => reloadOnMissingChunk(error, reload));

  it('reloads the requested page when its file has disappeared since the tab was opened', () => {
    const reload = vi.fn();
    handle(missing, reload);
    expect(reload).toHaveBeenCalledWith('/TuringsNode/achievements');
  });

  it('does not reload again right after a reload, to avoid a loop', () => {
    const reload = vi.fn();
    handle(missing, reload);
    handle(missing, reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('leaves the other navigation errors alone', () => {
    const reload = vi.fn();
    handle(new NavigationError(1, '/game', new Error('Something else')), reload);
    expect(reload).not.toHaveBeenCalled();
  });
});
