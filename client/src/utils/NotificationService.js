/**
 * Universal Notification Manager for Cosmify
 * Handles Browser Push API, Sound Alerts, and Permission State
 */
class NotificationService {
  constructor() {
    this.sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'); // Cosmic "ding"
    this.sound.volume = 0.5;
  }

  /**
   * Request permission for browser notifications
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Check current permission status
   */
  get permissionStatus() {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  /**
   * Play the cosmic notification sound
   */
  playSound() {
    try {
      this.sound.currentTime = 0;
      this.sound.play().catch(e => console.warn('Sound playback blocked:', e));
    } catch (err) {
      console.error('Audio error:', err);
    }
  }

  /**
   * Send a browser-level notification
   * @param {string} title - Sender name or App name
   * @param {object} options - body, icon, data
   */
  sendNotification(title, options = {}) {
    if (this.permissionStatus !== 'granted') return;

    // Only show if the tab is truly hidden or inactive
    if (document.visibilityState === 'visible') {
      // Still play sound in visible state if the user is in a different chat
      return; 
    }

    const defaultOptions = {
        icon: '/logo.png',
        badge: '/logo.png',
        silent: true, // we handle sound manually
        ...options
    };

    try {
        new Notification(title, defaultOptions);
    } catch (err) {
        console.error('Native notification failure:', err);
    }
  }
}

export default new NotificationService();
