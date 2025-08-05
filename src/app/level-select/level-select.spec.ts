import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelSelect } from './level-select';

describe('LevelSelect', () => {
  let component: LevelSelect;
  let fixture: ComponentFixture<LevelSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
