// ============================================================================
// Fiverr Keep-Alive Pro - Content Script
// Version: 7.5.0
// Ultra-Realistic Activity Simulation + Online Presence Guarantee
// ============================================================================

class UltraRealisticActivitySimulator {
  constructor() {
    this.mode = 'balanced';
    this.isUserActive = false;
    this.lastUserActivity = null;
    this.activityPatterns = [];
    this.keepAliveInterval = null;
    this.websocketKeepAlive = null;

    this.init();
  }

  init() {
    this.log('Ultra-Realistic Activity Simulator initialized', 'success');
    this.setupMessageListener();
    this.trackUserActivity();
    this.startPassiveKeepAlive();
    this.setupStorageKeepAlive();
    this.setupVisibilityHandler();
    this.notifyBackgroundReady();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'performActivity') {
        this.mode = request.mode || 'balanced';
        this.performActivity(request.forced);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  notifyBackgroundReady() {
    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({
          action: 'pageLoaded',
          url: window.location.href
        }).catch(() => {});
      } catch (e) {
        // Background not ready yet
      }
    }, 2000);
  }

  // ========== USER ACTIVITY TRACKING ==========

  trackUserActivity() {
    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];

    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.isUserActive = true;
        this.lastUserActivity = Date.now();

        // Reset after 60 seconds
        setTimeout(() => {
          if (Date.now() - this.lastUserActivity >= 60000) {
            this.isUserActive = false;
          }
        }, 60000);
      }, { passive: true });
    });
  }

  // ========== PASSIVE KEEP-ALIVE ==========

  startPassiveKeepAlive() {
    // Ultra-passive activity every 2 minutes when user is not active
    this.keepAliveInterval = setInterval(() => {
      if (!this.isUserActive) {
        this.performPassiveActivity();
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    this.log('Passive keep-alive started (every 2 minutes)', 'info');
  }

  async performPassiveActivity() {
    // Very subtle activities that won't interfere
    const passiveActivities = [
      () => window.focus(),
      () => this.updateSessionStorage(),
      () => this.triggerVisibilityCheck(),
      () => this.simulateMicroScroll()
    ];

    const activity = passiveActivities[Math.floor(Math.random() * passiveActivities.length)];
    await activity();

    this.log('Passive activity executed', 'debug');
  }

  setupStorageKeepAlive() {
    // Update localStorage/sessionStorage to maintain session
    setInterval(() => {
      this.updateSessionStorage();
    }, 3 * 60 * 1000); // Every 3 minutes

    this.log('Storage keep-alive initialized', 'info');
  }

  updateSessionStorage() {
    try {
      const timestamp = Date.now();
      sessionStorage.setItem('fiverr_keepalive_heartbeat', timestamp.toString());
      sessionStorage.setItem('last_activity', timestamp.toString());

      // Also update a custom property to simulate real usage
      const activityData = {
        timestamp: timestamp,
        type: 'heartbeat',
        random: Math.random()
      };
      sessionStorage.setItem('fiverr_activity_data', JSON.stringify(activityData));

      this.log('Session storage updated', 'debug');
    } catch (e) {
      // Storage might be full or blocked
    }
  }

  setupVisibilityHandler() {
    // Handle visibility change to maintain presence
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.log('Tab became visible, triggering activity', 'info');
        setTimeout(() => {
          this.performMiniActivity();
        }, 500);
      }
    });
  }

  triggerVisibilityCheck() {
    // Dispatch visibility event to trigger handlers
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
  }

  // ========== MAIN ACTIVITY SIMULATION ==========

  async performActivity(forced = false) {
    // Don't interfere if user is actively using the page (unless forced)
    if (!forced && this.isUserActive && Date.now() - this.lastUserActivity < 30000) {
      this.log('User is active, skipping simulation', 'info');
      return;
    }

    this.log(`Performing ${this.mode} mode activity${forced ? ' (FORCED)' : ''}`, 'activity');

    const activities = this.getActivitiesForMode();

    // Execute random activities
    for (const activity of activities) {
      try {
        await this.executeActivity(activity);
        await this.randomDelay(100, 500);
      } catch (error) {
        this.log('Activity error: ' + error.message, 'error');
      }
    }

    // Always update storage after activity
    this.updateSessionStorage();

    this.notifyActivityComplete();
  }

  async performMiniActivity() {
    // Quick, subtle activity
    window.focus();
    await this.randomDelay(100, 300);
    const scrollAmount = Math.random() > 0.5 ? 50 : -50;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  }

  getActivitiesForMode() {
    const allActivities = [
      'scroll',
      'mousemove',
      'focus',
      'hover',
      'microScroll',
      'typing',
      'click',
      'dropdown'
    ];

    switch (this.mode) {
      case 'stealth':
        // Only 1-2 subtle activities
        return this.pickRandom(allActivities.slice(0, 5), Math.random() > 0.5 ? 1 : 2);

      case 'balanced':
        // 3-4 balanced activities
        return this.pickRandom(allActivities, 3 + Math.floor(Math.random() * 2));

      case 'aggressive':
        // 4-6 more visible activities
        return this.pickRandom(allActivities, 4 + Math.floor(Math.random() * 3));

      default:
        return this.pickRandom(allActivities, 3);
    }
  }

  async executeActivity(activityType) {
    switch (activityType) {
      case 'scroll':
        await this.simulateScroll();
        break;

      case 'mousemove':
        await this.simulateMouseMove();
        break;

      case 'focus':
        this.simulateFocus();
        break;

      case 'hover':
        await this.simulateHover();
        break;

      case 'microScroll':
        await this.simulateMicroScroll();
        break;

      case 'typing':
        await this.simulateTyping();
        break;

      case 'click':
        await this.simulateClick();
        break;

      case 'dropdown':
        await this.simulateDropdown();
        break;
    }
  }

  // ========== INDIVIDUAL ACTIVITY SIMULATIONS ==========

  async simulateScroll() {
    const scrollPatterns = [
      { direction: 'down', distance: 150, smooth: true },
      { direction: 'down', distance: 300, smooth: true },
      { direction: 'up', distance: 100, smooth: true },
      { direction: 'down', distance: 50, smooth: false }
    ];

    const pattern = this.pickRandom(scrollPatterns, 1)[0];

    const distance = pattern.direction === 'down' ? pattern.distance : -pattern.distance;

    window.scrollBy({
      top: distance,
      behavior: pattern.smooth ? 'smooth' : 'auto'
    });

    this.log(`Scrolled ${pattern.direction} ${pattern.distance}px`, 'debug');
  }

  async simulateMicroScroll() {
    // Very small scrolls, like reading
    const microDistance = Math.random() > 0.5 ? 20 : -20;

    for (let i = 0; i < 3; i++) {
      window.scrollBy({ top: microDistance, behavior: 'smooth' });
      await this.randomDelay(300, 800);
    }

    this.log('Micro-scrolled (reading pattern)', 'debug');
  }

  async simulateMouseMove() {
    const movements = 3 + Math.floor(Math.random() * 5); // 3-7 movements
    const path = this.generateNaturalMousePath(movements);

    for (const point of path) {
      const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: point.x,
        clientY: point.y,
        movementX: point.deltaX || 0,
        movementY: point.deltaY || 0
      });

      document.dispatchEvent(event);
      await this.randomDelay(50, 150);
    }

    this.log(`Mouse moved along ${movements} points`, 'debug');
  }

  generateNaturalMousePath(points) {
    const path = [];
    let currentX = Math.random() * window.innerWidth;
    let currentY = Math.random() * window.innerHeight;

    for (let i = 0; i < points; i++) {
      // Natural curve movement with bezier-like interpolation
      const targetX = Math.random() * window.innerWidth;
      const targetY = Math.random() * window.innerHeight;

      const deltaX = (targetX - currentX) / 3;
      const deltaY = (targetY - currentY) / 3;

      currentX += deltaX + (Math.random() - 0.5) * 20; // Add jitter
      currentY += deltaY + (Math.random() - 0.5) * 20;

      // Keep within bounds
      currentX = Math.max(0, Math.min(window.innerWidth, currentX));
      currentY = Math.max(0, Math.min(window.innerHeight, currentY));

      path.push({
        x: Math.floor(currentX),
        y: Math.floor(currentY),
        deltaX,
        deltaY
      });
    }

    return path;
  }

  simulateFocus() {
    // Focus window and document
    window.focus();

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    // Dispatch focus event
    const event = new FocusEvent('focus', {
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);

    this.log('Window focused', 'debug');
  }

  async simulateHover() {
    // Find interactive elements
    const selectors = [
      'a',
      'button',
      '.gig-card',
      '.seller-card',
      '[role="button"]',
      'nav a',
      '.navigation-link'
    ];

    let elements = [];

    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      elements.push(...Array.from(found));
      if (elements.length >= 10) break;
    }

    if (elements.length === 0) {
      this.log('No elements to hover', 'debug');
      return;
    }

    // Pick random element
    const element = this.pickRandom(elements, 1)[0];

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Simulate hover
    const events = ['mouseover', 'mouseenter'];

    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window
      });

      element.dispatchEvent(event);
    }

    this.log(`Hovered over ${element.tagName}`, 'debug');

    // Simulate hover duration
    await this.randomDelay(500, 1500);

    // Mouse leave
    const leaveEvent = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true,
      view: window
    });

    element.dispatchEvent(leaveEvent);
  }

  // ========== NEW ADVANCED ACTIVITIES ==========

  async simulateTyping() {
    // Find search inputs or text fields
    const selectors = [
      'input[type="search"]',
      'input[type="text"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="cerca" i]',
      '.search-input'
    ];

    let input = null;

    for (const selector of selectors) {
      const found = document.querySelector(selector);
      if (found) {
        input = found;
        break;
      }
    }

    if (!input) {
      this.log('No input field found for typing', 'debug');
      return;
    }

    // Focus the input
    input.focus();
    await this.randomDelay(200, 400);

    // Simulate typing a random search term (but don't actually search)
    const searchTerms = ['design', 'logo', 'web', 'marketing', 'writing'];
    const term = this.pickRandom(searchTerms, 1)[0];

    // Type character by character
    for (let i = 0; i < term.length; i++) {
      const char = term[i];

      // Key down
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      input.dispatchEvent(keydownEvent);

      await this.randomDelay(80, 200); // Human typing speed

      // Update input value
      input.value += char;

      // Input event
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true
      });
      input.dispatchEvent(inputEvent);

      // Key up
      const keyupEvent = new KeyboardEvent('keyup', {
        key: char,
        bubbles: true
      });
      input.dispatchEvent(keyupEvent);
    }

    await this.randomDelay(500, 1000);

    // Clear the input (backspace simulation)
    for (let i = 0; i < term.length; i++) {
      const backspaceDown = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true
      });
      input.dispatchEvent(backspaceDown);

      input.value = input.value.slice(0, -1);

      const inputEvent = new Event('input', {
        bubbles: true
      });
      input.dispatchEvent(inputEvent);

      await this.randomDelay(50, 100);
    }

    input.blur();

    this.log('Typing simulation completed', 'debug');
  }

  async simulateClick() {
    // Find safe clickable elements (not buttons that submit forms)
    const selectors = [
      'nav a',
      '.navigation-link',
      '.tab:not(.active)',
      '[role="tab"]:not([aria-selected="true"])',
      '.filter-option',
      '.category-link'
    ];

    let elements = [];

    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      elements.push(...Array.from(found));
      if (elements.length >= 5) break;
    }

    if (elements.length === 0) {
      this.log('No safe clickable elements found', 'debug');
      return;
    }

    const element = this.pickRandom(elements, 1)[0];

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Simulate full click sequence: mousedown -> mouseup -> click
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0
    });
    element.dispatchEvent(mousedownEvent);

    await this.randomDelay(50, 150);

    const mouseupEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0
    });
    element.dispatchEvent(mouseupEvent);

    // DON'T actually click to avoid navigation
    // Just dispatch the events to simulate activity

    this.log(`Simulated click on ${element.tagName}`, 'debug');
  }

  async simulateDropdown() {
    // Find dropdown menus or expandable elements
    const selectors = [
      '[role="button"][aria-expanded]',
      '.dropdown-toggle',
      'button[aria-haspopup]',
      '.expandable'
    ];

    let dropdown = null;

    for (const selector of selectors) {
      const found = document.querySelector(selector);
      if (found) {
        dropdown = found;
        break;
      }
    }

    if (!dropdown) {
      this.log('No dropdown found', 'debug');
      return;
    }

    // Hover over dropdown
    const rect = dropdown.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const hoverEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      clientX: x,
      clientY: y
    });
    dropdown.dispatchEvent(hoverEvent);

    await this.randomDelay(1000, 2000);

    // Leave dropdown
    const leaveEvent = new MouseEvent('mouseleave', {
      bubbles: true
    });
    dropdown.dispatchEvent(leaveEvent);

    this.log('Dropdown interaction simulated', 'debug');
  }

  // ========== UTILITY METHODS ==========

  pickRandom(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  notifyActivityComplete() {
    try {
      chrome.runtime.sendMessage({
        action: 'activityComplete',
        timestamp: Date.now()
      }).catch(() => {});
    } catch (e) {
      // Background script not available
    }
  }

  log(message, level = 'info') {
    const emoji = {
      success: '✅',
      info: 'ℹ️',
      error: '❌',
      activity: '🔄',
      debug: '🔍'
    }[level] || 'ℹ️';

    console.log(`${emoji} [Fiverr KeepAlive Pro] ${message}`);
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

const simulator = new UltraRealisticActivitySimulator();

// Ultra-passive heartbeat - very subtle background activity
setInterval(() => {
  if (!simulator.isUserActive) {
    // Only focus and storage update, no other actions
    if (Math.random() > 0.5) { // 50% chance every 3 minutes
      window.focus();
      simulator.updateSessionStorage();
    }
  }
}, 3 * 60 * 1000); // Every 3 minutes
