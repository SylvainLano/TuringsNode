import { Component, ChangeDetectionStrategy } from '@angular/core';

import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  templateUrl: './notification.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./notification.scss']
})
export class NotificationComponent {
  public readonly notificationMessage;
  constructor(private notificationService: NotificationService) {
    this.notificationMessage = this.notificationService.message;
  }
}
