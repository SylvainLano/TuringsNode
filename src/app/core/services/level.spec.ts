import { TestBed } from '@angular/core/testing';

import { LevelService } from './level';

describe('Level', () => {
  let service: LevelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LevelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
