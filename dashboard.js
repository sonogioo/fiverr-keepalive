// ============================================================================
// Fiverr Keep-Alive Pro - Dashboard Controller
// Version: 7.5.0
// Full-Page Dashboard with Real-time Updates
// ============================================================================

class DashboardController {
  constructor() {
    this.state = null;
    this.updateInterval = null;
    this.logEntries = [];
    this.maxLogEntries = 100;
    this.elements = {};

    this.init();
  }

  // ========== INITIALIZATION ==========

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadState();
    this.startAutoUpdate();
    this.addLog('Dashboard inizializzata', 'info');
  }

  cacheElements() {
    // Status
    this.elements.globalStatus = document.getElementById('globalStatus');

    // Main controls
    this.elements.masterToggle = document.getElementById('masterToggle');
    this.elements.modeCards = document.querySelectorAll('.mode-card');

    // Statistics
    this.elements.uptimeValue = document.getElementById('uptimeValue');
    this.elements.activitiesValue = document.getElementById('activitiesValue');
    this.elements.currentPageValue = document.getElementById('currentPageValue');
    this.elements.errorsValue = document.getElementById('errorsValue');
    this.elements.lastActivityValue = document.getElementById('lastActivityValue');
    this.elements.crashesValue = document.getElementById('crashesValue');

    // Action buttons
    this.elements.forceActivityBtn = document.getElementById('forceActivityBtn');
    this.elements.forceRotationBtn = document.getElementById('forceRotationBtn');
    this.elements.resetStatsBtn = document.getElementById('resetStatsBtn');
    this.elements.openFiverrBtn = document.getElementById('openFiverrBtn');

    // Settings
    this.elements.autoRestartToggle = document.getElementById('autoRestartToggle');
    this.elements.smartRotationToggle = document.getElementById('smartRotationToggle');
    this.elements.notificationsToggle = document.getElementById('notificationsToggle');
    this.elements.detailedLoggingToggle = document.getElementById('detailedLoggingToggle');

    // Log
    this.elements.logContainer = document.getElementById('logContainer');
    this.elements.clearLogBtn = document.getElementById('clearLogBtn');

    // Notification container
    this.elements.notificationContainer = document.getElementById('notificationContainer');
  }

  setupEventListeners() {
    // Master toggle
    this.elements.masterToggle.addEventListener('change', (e) => {
      this.toggleKeepAlive(e.target.checked);
    });

    // Mode selection
    this.elements.modeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        this.changeMode(mode);
      });
    });

    // Action buttons
    this.elements.forceActivityBtn.addEventListener('click', () => {
      this.forceActivity();
    });

    this.elements.forceRotationBtn.addEventListener('click', () => {
      this.forceRotation();
    });

    this.elements.resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });

    this.elements.openFiverrBtn.addEventListener('click', () => {
      window.open('https://www.fiverr.com/', '_blank');
    });

    // Settings
    this.elements.autoRestartToggle.addEventListener('change', (e) => {
      this.updateConfig({ autoRestart: e.target.checked });
    });

    this.elements.smartRotationToggle.addEventListener('change', (e) => {
      this.updateConfig({ smartRotation: e.target.checked });
    });

    this.elements.notificationsToggle.addEventListener('change', (e) => {
      this.updateConfig({ notifications: e.target.checked });
    });

    // Log controls
    this.elements.clearLogBtn.addEventListener('click', () => {
      this.clearLog();
    });
  }

  // ========== STATE MANAGEMENT ==========

  async loadState() {
    try {
      const response = await this.sendMessage({ action: 'getState' });

      if (response.success) {
        this.state = response.state;
        this.updateUI();
      }
    } catch (error) {
      console.error('Error loading state:', error);
      this.addLog('Errore caricamento stato: ' + error.message, 'error');
    }
  }

  startAutoUpdate() {
    // Update every 1 second for real-time stats
    this.updateInterval = setInterval(() => {
      this.loadState();
    }, 1000);
  }

  updateUI() {
    if (!this.state) return;

    const { config, state } = this.state;

    // Update global status
    if (state.isRunning) {
      this.elements.globalStatus.classList.add('active');
      this.elements.globalStatus.querySelector('.status-text').textContent = 'Sistema Attivo';
    } else {
      this.elements.globalStatus.classList.remove('active');
      this.elements.globalStatus.querySelector('.status-text').textContent = 'Sistema Inattivo';
    }

    // Update master toggle
    this.elements.masterToggle.checked = config.enabled;

    // Update mode cards
    this.elements.modeCards.forEach(card => {
      if (card.dataset.mode === config.mode) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update statistics
    this.elements.uptimeValue.textContent = state.uptimeFormatted || '0s';
    this.elements.activitiesValue.textContent = state.activitiesCount || 0;
    this.elements.currentPageValue.textContent = this.formatPageUrl(state.currentPage);
    this.elements.errorsValue.textContent = state.errors || 0;
    this.elements.crashesValue.textContent = state.tabCrashes || 0;

    // Update last activity
    if (state.lastActivity) {
      const timeAgo = this.getTimeAgo(state.lastActivity);
      this.elements.lastActivityValue.textContent = timeAgo;
    } else {
      this.elements.lastActivityValue.textContent = 'Mai';
    }

    // Update settings toggles
    this.elements.autoRestartToggle.checked = config.autoRestart;
    this.elements.smartRotationToggle.checked = config.smartRotation;
    this.elements.notificationsToggle.checked = config.notifications;

    // Enable/disable action buttons
    const isRunning = state.isRunning;
    this.elements.forceActivityBtn.disabled = !isRunning;
    this.elements.forceRotationBtn.disabled = !isRunning;

    // Apply error styling
    if (state.errors > 0) {
      this.elements.errorsValue.style.color = 'var(--error)';
    } else {
      this.elements.errorsValue.style.color = '';
    }
  }

  // ========== USER ACTIONS ==========

  async toggleKeepAlive(enabled) {
    try {
      const action = enabled ? 'start' : 'stop';
      const response = await this.sendMessage({ action });

      if (response.success) {
        this.state = response.state;
        this.updateUI();
        const message = enabled ? 'Keep-Alive attivato!' : 'Keep-Alive disattivato';
        this.showNotification(message, 'success');
        this.addLog(message, enabled ? 'success' : 'info');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error toggling keep-alive:', error);
      this.showNotification('Errore durante l\'operazione', 'error');
      this.addLog('Errore toggle: ' + error.message, 'error');
      this.elements.masterToggle.checked = !enabled;
    }
  }

  async changeMode(mode) {
    try {
      const response = await this.sendMessage({
        action: 'updateConfig',
        config: { mode }
      });

      if (response.success) {
        await this.loadState();
        this.showNotification(`Modalità cambiata: ${mode}`, 'success');
        this.addLog(`Modalità cambiata a: ${mode}`, 'info');
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      this.showNotification('Errore nel cambio modalità', 'error');
      this.addLog('Errore cambio modalità: ' + error.message, 'error');
    }
  }

  async updateConfig(config) {
    try {
      const response = await this.sendMessage({
        action: 'updateConfig',
        config
      });

      if (response.success) {
        this.showNotification('Configurazione aggiornata', 'success');
        const key = Object.keys(config)[0];
        this.addLog(`Impostazione ${key} aggiornata`, 'info');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      this.showNotification('Errore nell\'aggiornamento', 'error');
    }
  }

  async forceActivity() {
    try {
      this.elements.forceActivityBtn.disabled = true;
      this.addLog('Forzando attività...', 'info');

      const response = await this.sendMessage({ action: 'forceActivity' });

      if (response && response.success) {
        this.showNotification('Attività forzata eseguita!', 'success');
        this.addLog('Attività forzata completata con successo', 'success');
        await this.loadState();
      } else {
        throw new Error(response?.error || 'Risposta non valida');
      }

      setTimeout(() => {
        if (this.state && this.state.state.isRunning) {
          this.elements.forceActivityBtn.disabled = false;
        }
      }, 2000);
    } catch (error) {
      console.error('Error forcing activity:', error);
      this.showNotification('Errore: ' + error.message, 'error');
      this.addLog('Errore attività forzata: ' + error.message, 'error');
      this.elements.forceActivityBtn.disabled = false;
    }
  }

  async forceRotation() {
    try {
      this.elements.forceRotationBtn.disabled = true;
      this.addLog('Forzando rotazione pagina...', 'info');

      await this.sendMessage({ action: 'forceRotation' });
      this.showNotification('Pagina cambiata!', 'success');
      this.addLog('Rotazione pagina completata', 'success');

      setTimeout(() => {
        if (this.state && this.state.state.isRunning) {
          this.elements.forceRotationBtn.disabled = false;
        }
      }, 2000);
    } catch (error) {
      console.error('Error forcing rotation:', error);
      this.showNotification('Errore nel cambio pagina', 'error');
      this.addLog('Errore rotazione: ' + error.message, 'error');
      this.elements.forceRotationBtn.disabled = false;
    }
  }

  async resetStats() {
    if (!confirm('Sei sicuro di voler resettare le statistiche?')) {
      return;
    }

    try {
      await this.sendMessage({ action: 'resetStats' });
      await this.loadState();
      this.showNotification('Statistiche resettate', 'success');
      this.addLog('Statistiche resettate', 'info');
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showNotification('Errore nel reset', 'error');
      this.addLog('Errore reset stats: ' + error.message, 'error');
    }
  }

  // ========== LOG MANAGEMENT ==========

  addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();

    const entry = {
      timestamp,
      message,
      type
    };

    this.logEntries.unshift(entry);

    // Keep only last 100 entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.pop();
    }

    // Update DOM
    this.renderLog();
  }

  renderLog() {
    if (!this.elements.detailedLoggingToggle.checked) {
      return;
    }

    this.elements.logContainer.innerHTML = '';

    this.logEntries.forEach(entry => {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${entry.type}`;

      const time = document.createElement('span');
      time.className = 'log-time';
      time.textContent = entry.timestamp;

      const message = document.createElement('span');
      message.className = 'log-message';
      message.textContent = entry.message;

      logEntry.appendChild(time);
      logEntry.appendChild(message);

      this.elements.logContainer.appendChild(logEntry);
    });

    // Auto-scroll to top
    this.elements.logContainer.scrollTop = 0;
  }

  clearLog() {
    this.logEntries = [];
    this.elements.logContainer.innerHTML = '<div class="log-entry info"><span class="log-time">--:--:--</span><span class="log-message">Log cancellato</span></div>';
  }

  // ========== UTILITIES ==========

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  formatPageUrl(url) {
    if (!url) return '-';

    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname;

      if (path === '/') return 'Home';
      if (path.includes('inbox')) return 'Inbox';
      if (path.includes('dashboard')) return 'Dashboard';
      if (path.includes('sellers')) return 'Sellers';
      if (path.includes('manage_gigs')) return 'Gigs';

      return path.substring(1, 20) + '...';
    } catch (e) {
      return url.substring(0, 20) + '...';
    }
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 5) return 'Adesso';
    if (seconds < 60) return `${seconds}s fa`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m fa`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h fa`;

    const days = Math.floor(hours / 24);
    return `${days}g fa`;
  }

  // ========== NOTIFICATIONS ==========

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    this.elements.notificationContainer.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

const dashboard = new DashboardController();

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (dashboard.updateInterval) {
    clearInterval(dashboard.updateInterval);
  }
});

// Listen to detailed logging toggle
document.getElementById('detailedLoggingToggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    dashboard.renderLog();
  } else {
    dashboard.elements.logContainer.innerHTML = '<div class="log-entry info"><span class="log-time">--:--:--</span><span class="log-message">Logging disabilitato</span></div>';
  }
});
