import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticlesBackground } from './particles-background';

describe('ParticlesBackground', () => {
  let component: ParticlesBackground;
  let fixture: ComponentFixture<ParticlesBackground>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticlesBackground]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticlesBackground);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
