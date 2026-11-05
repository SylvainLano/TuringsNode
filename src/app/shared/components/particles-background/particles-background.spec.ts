import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticlesBackgroundComponent } from './particles-background';
import { BackgroundService } from '../../../core/services/background';

describe('ParticlesBackgroundComponent', () => {
  let component: ParticlesBackgroundComponent;
  let fixture: ComponentFixture<ParticlesBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticlesBackgroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticlesBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fades the new background in over the previous one, then removes the previous one', () => {
    vi.useFakeTimers();
    expect(component.layers().length).toBe(1);

    TestBed.inject(BackgroundService).changeBackground('snow');
    fixture.detectChanges();
    const [previous, next] = component.layers();
    expect(next.id).not.toBe(previous.id);

    vi.advanceTimersByTime(800);
    expect(component.layers()).toEqual([next]);
  });
});
