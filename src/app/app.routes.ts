import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu'

// Le menu est chargé tout de suite ; les autres pages seulement quand on les ouvre
export const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'game', loadComponent: () => import('./game-board/game-board').then(m => m.GameBoardComponent) },
  { path: 'levels', loadComponent: () => import('./level-select/level-select').then(m => m.LevelSelectComponent) },
  { path: 'achievements', loadComponent: () => import('./achievements/achievements').then(m => m.AchievementsComponent) },
  { path: 'settings', loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '' }
];
