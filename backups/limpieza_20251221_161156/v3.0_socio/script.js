// script.js
import { initUI } from './js/ui.js';
import { initForms } from './js/forms.js';
import { initializePushNotifications } from './js/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initForms();
  initializePushNotifications();
});

