import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticlesBackgroundComponent } from './particles-background';

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
