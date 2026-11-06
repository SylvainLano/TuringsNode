import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { IconComponent } from './icon';

@Component({
  imports: [IconComponent],
  template: '<app-icon name="moon" />'
})
class Host {}

describe('IconComponent', () => {
  it('draws the icon of the assets folder, under the base of the game', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [{ provide: APP_BASE_HREF, useValue: '/TuringsNode/' }] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('app-icon');
    expect(icon.style.getPropertyValue('--icon')).toBe('url("/TuringsNode/assets/icons/moon.svg")');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
