// ============================================================================
// Fiverr Keep-Alive Pro - Popup Controller (Minimale)
// Version: 7.5.0
// Quick Controls + Dashboard Launcher
// ============================================================================

class MinimalPopupController {
  constructor() {
    this.state = null;
    this.updateInterval = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadState();
    this.startAutoUpdate();
  }

  setupEventListeners() {
    // Quick toggle
    document.getElementById('quickToggle').addEventListener('click', () => {
      this.quickToggle();
    });

    // Dashboard button
    document.getElementById('dashboardBtn').addEventListener('click', () => {
      this.openDashboard();
    });
  }

  async loadState() {
    try {
      const response = await this.sendMessage({ action: 'getState' });

      if (response.success) {
        this.state = response.state;
        this.updateUI();
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.loadState();
    }, 1000);
  }

  updateUI() {
    if (!this.state) return;

    const { config, state } = this.state;

    // Update status display
    const statusDisplay = document.getElementById('statusDisplay');
    const statusText = document.getElementById('statusText');
    const quickToggle = document.getElementById('quickToggle');
    const toggleText = document.getElementById('toggleText');

    if (config.enabled) {
      statusDisplay.classList.add('active');
      statusText.textContent = 'Attivo';
      quickToggle.classList.remove('off');
      toggleText.textContent = 'Disattiva Keep-Alive';
    } else {
      statusDisplay.classList.remove('active');
      statusText.textContent = 'Inattivo';
      quickToggle.classList.add('off');
      toggleText.textContent = 'Attiva Keep-Alive';
    }

    // Update mini stats
    document.getElementById('miniUptime').textContent = state.uptimeFormatted || '0s';
    document.getElementById('miniActivities').textContent = state.activitiesCount || 0;
    document.getElementById('miniErrors').textContent = state.errors || 0;
  }

  async quickToggle() {
    if (!this.state) return;

    const currentState = this.state.config.enabled;
    const newState = !currentState;

    try {
      const action = newState ? 'start' : 'stop';
      const response = await this.sendMessage({ action });

      if (response.success) {
        this.state = response.state;
        this.updateUI();
      }
    } catch (error) {
      console.error('Error toggling:', error);
    }
  }

  openDashboard() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  }

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
}

// Initialize
const popup = new MinimalPopupController();

// Cleanup
window.addEventListener('beforeunload', () => {
  if (popup.updateInterval) {
    clearInterval(popup.updateInterval);
  }
});
