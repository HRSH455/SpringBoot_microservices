import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Error notification model
 */
export interface ErrorNotification {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  id?: string;
}

/**
 * Error Notification Service
 * Manages application-wide notifications for errors and other messages
 * Can be used with a notification component to display toasts or alerts
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorNotificationService {

  private notificationsSubject = new BehaviorSubject<ErrorNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private notificationId = 0;

  constructor() { }

  /**
   * Add an error notification
   * @param message Error message to display
   * @param duration Time in ms to show notification (0 for permanent)
   */
  error(message: string, duration: number = 5000): void {
    this.addNotification({ message, type: 'error', duration });
  }

  /**
   * Add a warning notification
   * @param message Warning message to display
   * @param duration Time in ms to show notification
   */
  warning(message: string, duration: number = 5000): void {
    this.addNotification({ message, type: 'warning', duration });
  }

  /**
   * Add an info notification
   * @param message Info message to display
   * @param duration Time in ms to show notification
   */
  info(message: string, duration: number = 3000): void {
    this.addNotification({ message, type: 'info', duration });
  }

  /**
   * Add a success notification
   * @param message Success message to display
   * @param duration Time in ms to show notification
   */
  success(message: string, duration: number = 3000): void {
    this.addNotification({ message, type: 'success', duration });
  }

  /**
   * Add a custom notification
   * @param notification Notification object
   */
  notify(notification: ErrorNotification): void {
    this.addNotification(notification);
  }

  /**
   * Remove a notification by ID
   * @param id Notification ID
   */
  removeNotification(id: string): void {
    const current = this.notificationsSubject.getValue();
    const updated = current.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  private addNotification(notification: ErrorNotification): void {
    const id = `notification-${++this.notificationId}`;
    const newNotification = { ...notification, id };
    
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...current, newNotification]);

    // Auto-remove after duration if specified
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }
  }
}
