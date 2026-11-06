import { TestBed } from '@angular/core/testing';

import { BackgroundService } from './background';

describe('Background', () => {
  afterEach(() => vi.useRealTimers());

  function createService(date: Date): BackgroundService {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(date);
    TestBed.configureTestingModule({});
    return TestBed.inject(BackgroundService);
  }

  it('starts with the day background during the day', () => {
    expect(createService(new Date(2026, 5, 21, 14)).state().value).toBe('day');
  });

  it('starts with the night background at night', () => {
    expect(createService(new Date(2026, 0, 15, 23)).state().value).toBe('night');
  });

  it('shows fireflies between midnight and 4 a.m.', () => {
    expect(createService(new Date(2026, 0, 15, 2)).state().value).toBe('fireflies');
  });
});
