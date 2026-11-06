import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';
import { StatsService } from './stats';
import { AchievementService } from './achievement';
import { BUTTON_NAMES, Level, groupByWorld } from '../engine';

describe('StatsService', () => {
  let service: StatsService;
  let achievements: AchievementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: APP_BASE_HREF, useValue: '/' }]
    });
    service = TestBed.inject(StatsService);
    achievements = TestBed.inject(AchievementService);
  });

  afterEach(() => {
    localStorage.removeItem('turings_node_stats');
    localStorage.removeItem('turings_node_achievements');
  });

  const has = (id: string) => achievements.unlockedAchievements().has(id);

  it('counts the melted medals and remembers the notices, then forgets everything on reset', () => {
    service.payForNotice('Plus:green', { 4: 'Chocolat' });
    service.payForNotice('Plus:green', { 4: 'Chocolat', 5: 'Chocolat' });
    expect(JSON.parse(localStorage.getItem('turings_node_stats')!)).toEqual({ melts: 2, clicks: 0, undos: 0, notices: ['Plus:green'] });
    expect(has('shame_first')).toBe(true);

    service.reset();
    expect(service.stats()).toEqual({ melts: 0, clicks: 0, undos: 0, notices: [] });
    expect(localStorage.getItem('turings_node_stats')).toBeNull();
  });

  it('turns ten melted medals into a vocation, and every notice into the complete manual', () => {
    for (let i = 1; i <= 9; i++) service.payForNotice(`Plus:${i}`, {});
    expect(has('shame_ten')).toBe(false);
    service.payForNotice('Plus:10', {});
    expect(has('shame_ten')).toBe(true);
    expect(has('shame_all')).toBe(false);

    BUTTON_NAMES.forEach(name => ['green', 'action'].forEach(part => service.payForNotice(`${name}:${part}`, {})));
    expect(has('shame_all')).toBe(true);
  });

  it('calls the player Willy Wonka once a well-started game has nothing but chocolate', () => {
    const results: Record<number, string> = {};
    for (let level = 1; level <= 18; level++) results[level] = 'Chocolat';
    service.payForNotice('Plus:green', { ...results, 19: 'Or' });
    expect(has('shame_wonka')).toBe(false);
    service.payForNotice('Plus:green', results);
    expect(has('shame_wonka')).toBe(true);
  });

  it('counts the clicks and the undos, with an achievement for each habit', () => {
    for (let i = 0; i < 99; i++) service.addUndo();
    expect(has('habit_undo')).toBe(false);
    service.addUndo();
    expect(has('habit_undo')).toBe(true);

    service.stats.update(stats => ({ ...stats, clicks: 4998 }));
    service.addClick();
    expect(has('habit_clicks')).toBe(false);
    service.addClick();
    expect([service.stats().clicks, has('habit_clicks')]).toEqual([5000, true]);
  });

  it('grants the platinum achievements, from world 4 on for a whole world', () => {
    const level = (levelNumber: number, world: number): Level => ({
      levelNumber, world, name: 'tester', startScore: 20, minScore: 10, maxScore: null,
      minSteps: 1, goldSteps: 2, silverSteps: 3, bronzeSteps: 4, buttons: [{ name: 'Plus', initialValue: 1 }]
    });
    const levels = [level(1, 1), level(2, 4)];
    const worlds = groupByWorld(levels);

    service.checkMedalAchievements(levels, worlds, { 1: 'Platine', 2: 'Chocolat' });
    expect([has('feat_world'), has('feat_campaign')]).toEqual([false, false]);

    service.checkMedalAchievements(levels, worlds, { 1: 'Platine', 2: 'Platine' });
    expect([has('feat_world'), has('feat_campaign')]).toEqual([true, true]);
  });
});
