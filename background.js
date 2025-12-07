// ============================================================================
// Fiverr Keep-Alive Pro - Background Service Worker
// Version: 7.0.0
// Architecture: Modular, Event-Driven, Production-Ready
// ============================================================================

class FiverrKeepAlivePro {
  constructor() {
    this.config = {
      enabled: false,
      mode: 'balanced', // stealth | balanced | aggressive
      customInterval: null,
      notifications: true,
      autoRestart: true,
      smartRotation: true
    };

    this.state = {
      tabId: null,
      currentPageIndex: 0,
      lastActivity: null,
      activitiesCount: 0,
      errors: 0,
      uptime: 0,
      startTime: null,
      tabCrashes: 0
    };

    this.intervals = {
      activity: null,
      rotation: null,
      heartbeat: null,
      stats: null
    };

    this.pages = [
      'https://www.fiverr.com/',
      'https://www.fiverr.com/inbox',
      'https://www.fiverr.com/dashboard',
      'https://www.fiverr.com/sellers'
    ];

    // Activity intervals based on mode (in milliseconds)
    this.modeSettings = {
      stealth: {
        activityInterval: [45000, 90000], // Random between 45s-90s
        rotationInterval: 8 * 60 * 1000,  // 8 minutes
        description: 'Modalità stealth - Attività poco frequenti e randomizzate'
      },
      balanced: {
        activityInterval: [25000, 45000], // Random between 25s-45s
        rotationInterval: 5 * 60 * 1000,  // 5 minutes
        description: 'Modalità bilanciata - Equilibrio tra efficacia e discrezione'
      },
      aggressive: {
        activityInterval: [15000, 30000], // Random between 15s-30s
        rotationInterval: 3 * 60 * 1000,  // 3 minutes
        description: 'Modalità aggressiva - Massima presenza online'
      }
    };

    this.init();
  }

  // ========== INITIALIZATION ==========

  init() {
    this.log('Initializing Fiverr Keep-Alive Pro...', 'system');
    this.loadSettings();
    this.setupListeners();
    this.updateBadge();
  }

  async loadSettings() {
    try {
      const data = await chrome.storage.sync.get(['keepAliveConfig', 'keepAliveState']);

      if (data.keepAliveConfig) {
        this.config = { ...this.config, ...data.keepAliveConfig };
      }

      if (this.config.enabled) {
        this.log('Auto-starting from saved settings', 'info');
        await this.start();
      }
    } catch (error) {
      this.log('Error loading settings: ' + error.message, 'error');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        keepAliveConfig: this.config,
        keepAliveState: this.state
      });
    } catch (error) {
      this.log('Error saving settings: ' + error.message, 'error');
    }
  }

  setupListeners() {
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Tab removed listener
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Tab crash detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (tabId === this.state.tabId && changeInfo.status === 'complete') {
        this.log('Tab loaded successfully', 'success');
      }
    });
  }

  // ========== MESSAGE HANDLER ==========

  async handleMessage(request, sender, sendResponse) {
    const { action } = request;

    try {
      switch (action) {
        case 'start':
          await this.start();
          sendResponse({ success: true, state: this.getState() });
          break;

        case 'stop':
          await this.stop();
          sendResponse({ success: true, state: this.getState() });
          break;

        case 'getState':
          sendResponse({ success: true, state: this.getState() });
          break;

        case 'updateConfig':
          await this.updateConfig(request.config);
          sendResponse({ success: true, config: this.config });
          break;

        case 'resetStats':
          this.resetStats();
          sendResponse({ success: true });
          break;

        case 'forceActivity':
          await this.performActivity(true); // Force execution even if disabled
          sendResponse({ success: true });
          break;

        case 'forceRotation':
          await this.rotatePage();
          sendResponse({ success: true });
          break;

        case 'activityComplete':
          this.state.activitiesCount++;
          this.state.lastActivity = Date.now();
          await this.saveSettings();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      this.log('Error handling message: ' + error.message, 'error');
      sendResponse({ success: false, error: error.message });
    }
  }

  // ========== CORE FUNCTIONALITY ==========

  async start() {
    if (this.config.enabled) {
      this.log('Already running', 'warn');
      return;
    }

    this.log('Starting Keep-Alive Pro...', 'system');

    this.config.enabled = true;
    this.state.startTime = Date.now();
    this.state.errors = 0;
    this.state.tabCrashes = 0;

    await this.saveSettings();

    // Create monitoring tab
    await this.createTab();

    // Start activity intervals
    this.startActivityLoop();
    this.startRotationLoop();
    this.startHeartbeat();
    this.startStatsUpdater();

    this.updateBadge();
    this.log('Keep-Alive Pro started successfully', 'success');
  }

  async stop() {
    if (!this.config.enabled) {
      this.log('Already stopped', 'warn');
      return;
    }

    this.log('Stopping Keep-Alive Pro...', 'system');

    this.config.enabled = false;

    // Clear all intervals
    Object.keys(this.intervals).forEach(key => {
      if (this.intervals[key]) {
        clearInterval(this.intervals[key]);
        clearTimeout(this.intervals[key]);
        this.intervals[key] = null;
      }
    });

    // Close tab
    if (this.state.tabId) {
      try {
        await chrome.tabs.remove(this.state.tabId);
      } catch (error) {
        this.log('Tab already closed', 'info');
      }
      this.state.tabId = null;
    }

    await this.saveSettings();
    this.updateBadge();
    this.log('Keep-Alive Pro stopped successfully', 'success');
  }

  async createTab() {
    try {
      // Close existing tab if any
      if (this.state.tabId) {
        try {
          await chrome.tabs.remove(this.state.tabId);
        } catch (e) {
          // Tab already closed
        }
      }

      // Create new tab
      const tab = await chrome.tabs.create({
        url: this.pages[0],
        active: false,
        pinned: false
      });

      this.state.tabId = tab.id;
      this.log(`Tab created: ${tab.id}`, 'success');

      // Wait for tab to load
      await this.waitForTabLoad(tab.id);

    } catch (error) {
      this.state.errors++;
      this.log('Error creating tab: ' + error.message, 'error');

      if (this.config.autoRestart) {
        this.log('Auto-restart in 10 seconds...', 'info');
        setTimeout(() => this.createTab(), 10000);
      }
    }
  }

  async waitForTabLoad(tabId, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Tab load timeout'));
      }, timeout);

      const checkTab = async () => {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab.status === 'complete') {
            clearTimeout(timer);
            resolve(tab);
          } else {
            setTimeout(checkTab, 500);
          }
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      };

      checkTab();
    });
  }

  // ========== ACTIVITY LOOPS ==========

  startActivityLoop() {
    const performActivityWithRandomDelay = () => {
      const settings = this.modeSettings[this.config.mode];
      const [min, max] = settings.activityInterval;
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;

      this.intervals.activity = setTimeout(async () => {
        if (this.config.enabled) {
          await this.performActivity();
          performActivityWithRandomDelay(); // Schedule next activity
        }
      }, delay);

      this.log(`Next activity in ${(delay / 1000).toFixed(1)}s`, 'debug');
    };

    performActivityWithRandomDelay();
  }

  startRotationLoop() {
    const settings = this.modeSettings[this.config.mode];
    const interval = settings.rotationInterval;

    this.intervals.rotation = setInterval(async () => {
      if (this.config.enabled && this.config.smartRotation) {
        await this.rotatePage();
      }
    }, interval);

    this.log(`Page rotation every ${interval / 60000} minutes`, 'info');
  }

  startHeartbeat() {
    // Heartbeat every 30 seconds to monitor tab health
    this.intervals.heartbeat = setInterval(async () => {
      if (!this.config.enabled) return;

      try {
        const tab = await chrome.tabs.get(this.state.tabId);

        if (!tab || tab.discarded) {
          this.log('Tab discarded or missing, recreating...', 'warn');
          this.state.tabCrashes++;
          await this.createTab();
        }
      } catch (error) {
        this.log('Heartbeat check failed, recreating tab...', 'error');
        this.state.tabCrashes++;
        await this.createTab();
      }
    }, 30000);
  }

  startStatsUpdater() {
    // Update stats every second
    this.intervals.stats = setInterval(() => {
      if (this.config.enabled && this.state.startTime) {
        this.state.uptime = Date.now() - this.state.startTime;
      }
    }, 1000);
  }

  // ========== ACTIVITY SIMULATION ==========

  async performActivity(forced = false) {
    // Allow forced execution even if disabled
    if (!forced && (!this.config.enabled || !this.state.tabId)) return;

    // If forced but no tab, create one first
    if (forced && !this.state.tabId) {
      this.log('No tab found, creating one for forced activity...', 'info');
      await this.createTab();
      // Wait a bit for content script to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!this.state.tabId) {
      throw new Error('No tab available for activity');
    }

    this.log('Performing activity...' + (forced ? ' (FORCED)' : ''), 'activity');

    try {
      const tab = await chrome.tabs.get(this.state.tabId);

      if (!tab) {
        throw new Error('Tab not found');
      }

      // Send activity command to content script
      await chrome.tabs.sendMessage(this.state.tabId, {
        action: 'performActivity',
        mode: this.config.mode,
        timestamp: Date.now(),
        forced: forced
      });

      this.state.activitiesCount++;
      this.state.lastActivity = Date.now();

      this.log('Activity performed successfully', 'success');

    } catch (error) {
      this.state.errors++;
      this.log('Activity error: ' + error.message, 'error');

      // If tab is gone, recreate it
      if (error.message.includes('tab') || error.message.includes('frame')) {
        this.log('Tab lost, recreating...', 'warn');
        await this.createTab();
      }

      throw error; // Re-throw to let caller handle it
    }
  }

  async rotatePage() {
    if (!this.config.enabled || !this.state.tabId) return;

    try {
      this.state.currentPageIndex = (this.state.currentPageIndex + 1) % this.pages.length;
      const newUrl = this.pages[this.state.currentPageIndex];

      await chrome.tabs.update(this.state.tabId, { url: newUrl });

      this.log(`Rotated to: ${newUrl}`, 'info');

      // Wait for new page to load
      await this.waitForTabLoad(this.state.tabId);

    } catch (error) {
      this.state.errors++;
      this.log('Rotation error: ' + error.message, 'error');
    }
  }

  // ========== CONFIGURATION ==========

  async updateConfig(newConfig) {
    const wasEnabled = this.config.enabled;
    const oldMode = this.config.mode;

    this.config = { ...this.config, ...newConfig };
    await this.saveSettings();

    this.log('Configuration updated', 'info');

    // If mode changed and system is running, restart intervals
    if (wasEnabled && oldMode !== this.config.mode) {
      this.log('Mode changed, restarting intervals...', 'info');

      // Clear old intervals
      if (this.intervals.activity) {
        clearTimeout(this.intervals.activity);
        clearInterval(this.intervals.rotation);
      }

      // Start new intervals with new mode
      this.startActivityLoop();
      this.startRotationLoop();
    }
  }

  // ========== UTILITY METHODS ==========

  getState() {
    return {
      config: this.config,
      state: {
        ...this.state,
        currentPage: this.pages[this.state.currentPageIndex],
        isRunning: this.config.enabled,
        uptimeFormatted: this.formatUptime(this.state.uptime)
      },
      modeSettings: this.modeSettings[this.config.mode]
    };
  }

  resetStats() {
    this.state.activitiesCount = 0;
    this.state.errors = 0;
    this.state.tabCrashes = 0;
    this.state.uptime = 0;
    this.state.startTime = this.config.enabled ? Date.now() : null;
    this.saveSettings();
    this.log('Statistics reset', 'info');
  }

  formatUptime(ms) {
    if (!ms) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  updateBadge() {
    if (this.config.enabled) {
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#1DBF73' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }

  handleTabRemoved(tabId) {
    if (tabId === this.state.tabId && this.config.enabled) {
      this.log('Keep-Alive tab closed unexpectedly', 'warn');
      this.state.tabId = null;
      this.state.tabCrashes++;

      if (this.config.autoRestart) {
        this.log('Auto-restarting tab in 5 seconds...', 'info');
        setTimeout(() => {
          if (this.config.enabled && !this.state.tabId) {
            this.createTab();
          }
        }, 5000);
      }
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = '[KeepAlive Pro]';
    const emoji = {
      system: '⚙️',
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      activity: '🔄',
      debug: '🔍'
    }[level] || 'ℹ️';

    console.log(`${emoji} ${prefix} [${timestamp}] ${message}`);
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

const keepAlivePro = new FiverrKeepAlivePro();

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    keepAlivePro.log('Extension installed successfully!', 'system');
  } else if (details.reason === 'update') {
    keepAlivePro.log('Extension updated to v7.0.0', 'system');
  }
});
