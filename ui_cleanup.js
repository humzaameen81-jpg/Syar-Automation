/**
 * UI Cleanup - Removes backup UI and adds Google integration UI
 * Version: 2.0.0
 */

(function() {
  'use strict';

  // Selectors for backup-related UI elements
  const BACKUP_SELECTORS = [
    // By data attributes
    '[data-testid*="backup"]',
    '[data-testid*="restore"]',
    '[data-testid*="sync"]',
    '[data-action*="backup"]',
    '[data-action*="restore"]',
    '[data-action*="sync"]',
    
    // By class names
    '[class*="backup"]',
    '[class*="restore"]',
    '[class*="sync-cloud"]',
    '[class*="cloud-sync"]',
    '[class*="cloud-backup"]',
    
    // By IDs
    '[id*="backup"]',
    '[id*="restore"]',
    '[id*="sync-cloud"]',
    
    // Specific elements
    '.backup-workflow',
    '.restore-workflow',
    '.sync-workflow',
    '.backup-btn',
    '.restore-btn',
    '.backup-menu',
    '.restore-menu',
    
    // Menu items
    '[role="menuitem"][class*="backup"]',
    '[role="menuitem"][class*="restore"]'
  ];

  // Text content to search for
  const BACKUP_TEXTS = [
    'backup workflow',
    'restore workflow',
    'sync to cloud',
    'cloud backup',
    'backup to drive',
    'restore from drive',
    'sync workflows',
    'export to cloud',
    'import from cloud'
  ];

  /**
   * Remove backup-related UI elements
   */
  function removeBackupUI() {
    let removedCount = 0;
    
    // Remove by selectors
    BACKUP_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!el.hasAttribute('data-guard-removed')) {
            el.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important;';
            el.setAttribute('data-guard-removed', 'true');
            removedCount++;
          }
        });
      } catch (e) {
        // Selector might not be valid, skip it
      }
    });

    // Remove by text content
    const allElements = document.querySelectorAll('button, a, span, div, li, [role="button"], [role="menuitem"]');
    allElements.forEach(el => {
      const text = (el.textContent || '').toLowerCase().trim();
      const matchesBackupText = BACKUP_TEXTS.some(bt => text.includes(bt.toLowerCase()));
      
      if (matchesBackupText && !el.hasAttribute('data-guard-removed')) {
        el.style.cssText = 'display: none !important; visibility: hidden !important;';
        el.setAttribute('data-guard-removed', 'true');
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`[UI Cleanup] 🧹 Removed ${removedCount} backup-related elements`);
    }

    return removedCount;
  }

  /**
   * Add Google Integration panel to settings
   */
  function addGoogleIntegrationUI() {
    // Don't add if already exists
    if (document.getElementById('google-integration-panel')) {
      return;
    }

    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'google-integration-panel';
    panel.innerHTML = `
      <style>
        #google-integration-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 300px;
          padding: 16px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 999999;
          transition: all 0.3s ease;
        }
        #google-integration-panel.minimized {
          width: auto;
          padding: 8px 12px;
        }
        #google-integration-panel.minimized .panel-content {
          display: none;
        }
        #google-integration-panel .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        #google-integration-panel.minimized .panel-header {
          margin-bottom: 0;
        }
        #google-integration-panel h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #google-integration-panel .minimize-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
        }
        #google-integration-panel .minimize-btn:hover {
          background: #f0f0f0;
        }
        #google-integration-panel .status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        #google-integration-panel .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #dc3545;
        }
        #google-integration-panel .status-dot.connected {
          background: #28a745;
        }
        #google-integration-panel .status-text {
          font-size: 13px;
          color: #555;
        }
        #google-integration-panel .action-btn {
          width: 100%;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }
        #google-integration-panel .action-btn:last-child {
          margin-bottom: 0;
        }
        #google-integration-panel .connect-btn {
          background: #4285f4;
          color: white;
        }
        #google-integration-panel .connect-btn:hover {
          background: #3367d6;
        }
        #google-integration-panel .disconnect-btn {
          background: #f8f9fa;
          color: #dc3545;
          border: 1px solid #dc3545;
        }
        #google-integration-panel .disconnect-btn:hover {
          background: #dc3545;
          color: white;
        }
        #google-integration-panel .sheets-btn {
          background: #34a853;
          color: white;
        }
        #google-integration-panel .sheets-btn:hover {
          background: #2d8f47;
        }
        #google-integration-panel .info-text {
          font-size: 11px;
          color: #888;
          margin-top: 12px;
          text-align: center;
        }
      </style>
      
      <div class="panel-header">
        <h3>🔗 Google Integration</h3>
        <button class="minimize-btn" id="google-panel-minimize">−</button>
      </div>
      
      <div class="panel-content">
        <div class="status-row">
          <span class="status-dot" id="google-status-dot"></span>
          <span class="status-text" id="google-status-text">Checking...</span>
        </div>
        
        <div id="google-actions">
          <button class="action-btn connect-btn" id="google-connect-btn">
            Connect Google Account
          </button>
        </div>
        
        <div class="info-text">
          Direct integration • No third-party services
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    
    // Setup minimize toggle
    const minimizeBtn = document.getElementById('google-panel-minimize');
    minimizeBtn.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeBtn.textContent = panel.classList.contains('minimized') ? '+' : '−';
    });

    // Setup connection logic
    setupGoogleConnection();
    
    console.log('[UI Cleanup] ✅ Google Integration panel added');
  }

  /**
   * Setup Google connection handlers
   */
  async function setupGoogleConnection() {
    const statusDot = document.getElementById('google-status-dot');
    const statusText = document.getElementById('google-status-text');
    const actionsDiv = document.getElementById('google-actions');

    // Update UI based on connection status
    async function updateUI(connected) {
      if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        actionsDiv.innerHTML = `
          <button class="action-btn sheets-btn" id="google-sheets-btn">
            📊 Browse Google Sheets
          </button>
          <button class="action-btn disconnect-btn" id="google-disconnect-btn">
            Disconnect
          </button>
        `;
        
        // Setup disconnect handler
        document.getElementById('google-disconnect-btn').addEventListener('click', async () => {
          if (window.googleIntegration) {
            await window.googleIntegration.disconnect();
            updateUI(false);
          }
        });

        // Setup sheets browser
        document.getElementById('google-sheets-btn').addEventListener('click', async () => {
          try {
            if (window.googleIntegration) {
              const sheets = await window.googleIntegration.listSheets();
              console.log('[UI Cleanup] 📊 Found sheets:', sheets);
              alert(`Found ${sheets.length} Google Sheets!\n\nCheck browser console for details.`);
            }
          } catch (e) {
            alert('Error: ' + e.message);
          }
        });
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Not connected';
        actionsDiv.innerHTML = `
          <button class="action-btn connect-btn" id="google-connect-btn">
            Connect Google Account
          </button>
        `;
        
        // Setup connect handler
        document.getElementById('google-connect-btn').addEventListener('click', async () => {
          try {
            statusText.textContent = 'Connecting...';
            if (window.googleIntegration) {
              await window.googleIntegration.authenticate();
              updateUI(true);
            } else {
              throw new Error('Google Integration not loaded');
            }
          } catch (e) {
            statusText.textContent = 'Connection failed';
            alert('Failed to connect: ' + e.message);
            setTimeout(() => updateUI(false), 2000);
          }
        });
      }
    }

    // Check initial status
    try {
      if (window.googleIntegration) {
        const status = await window.googleIntegration.getConnectionStatus();
        updateUI(status.connected);
      } else {
        // Wait for google integration to load
        setTimeout(async () => {
          if (window.googleIntegration) {
            const status = await window.googleIntegration.getConnectionStatus();
            updateUI(status.connected);
          } else {
            updateUI(false);
          }
        }, 1000);
      }
    } catch (e) {
      updateUI(false);
    }
  }

  /**
   * Initialize
   */
  function init() {
    console.log('[UI Cleanup] 🚀 Initializing...');
    
    // Remove backup UI
    removeBackupUI();
    
    // Add Google integration UI (only on extension pages)
    if (window.location.protocol === 'chrome-extension:') {
      addGoogleIntegrationUI();
    }

    // Watch for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldClean = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldClean = true;
          break;
        }
      }
      if (shouldClean) {
        removeBackupUI();
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    console.log('[UI Cleanup] ✅ Initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.__uiCleanup = {
    removeBackupUI,
    addGoogleIntegrationUI,
    BACKUP_SELECTORS,
    version: '2.0.0'
  };

})();
