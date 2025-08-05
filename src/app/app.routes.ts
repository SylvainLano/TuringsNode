import { Routes } from '@angular/router';
import { GameBoardComponent } from './game-board/game-board'
import { MenuComponent } from './menu/menu'
import { LevelSelectComponent } from './level-select/level-select';
import { AchievementsComponent } from './achievements/achievements'

export const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'game', component: GameBoardComponent },
  { path: 'levels', component: LevelSelectComponent },
  { path: 'achievements', component: AchievementsComponent }
];
