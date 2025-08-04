import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.scss']
})
export class NotificationComponent {
  public readonly notificationMessage;
  constructor(private notificationService: NotificationService) {
    this.notificationMessage = this.notificationService.message;
  }
}
