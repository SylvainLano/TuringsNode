import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { LevelSelectComponent } from './level-select';
import { LevelService } from '../core/services/level';

describe('LevelSelectComponent', () => {
  let component: LevelSelectComponent;
  let fixture: ComponentFixture<LevelSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSelectComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the levels introducing a button', () => {
    const base = { minScore: 10, maxScore: null, startScore: 20, minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4 };
    TestBed.inject(LevelService).levels.set([
      { ...base, levelNumber: 1, buttons: [{ name: 'Split', initialValue: 1 }] },
      { ...base, levelNumber: 2, buttons: [{ name: 'Split', initialValue: 2 }] },
      { ...base, levelNumber: 3, buttons: [{ name: 'Split', initialValue: 1 }, { name: 'Boost', initialValue: 1 }] }
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('.level-button').length).toBe(3);
    expect([...element.querySelectorAll('.intro-badge')].map(badge => badge.textContent?.trim())).toEqual(['+ Split', '+ Boost']);
  });
});
