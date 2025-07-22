import { Routes } from '@angular/router';
import { GameBoardComponent } from './game-board/game-board'

export const routes: Routes = [
  { path: 'gameboard', component: GameBoardComponent },
  { path: '', redirectTo: '/gameboard', pathMatch: 'full' }
];
