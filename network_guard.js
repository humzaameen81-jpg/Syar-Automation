/**
 * Network Guard - Blocks unauthorized external requests
 * Prevents all Automa and backup-related network calls
 * Version: 2.0.0
 */

(function() {
  'use strict';

  // Domains to block
  const BLOCKED_DOMAINS = [
    'automa.site',
    'www.automa.site',
    'api.automa.site',
    'automa-api.vercel.app',
    'automa-backup.vercel.app',
    'backup.automa.site',
    'sync.automa.site',
    'cloud.automa.site',
    'storage.automa.site'
  ];

  // Patterns to block
  const BLOCKED_PATTERNS = [
    /automa.*\.vercel\.app/i,
    /.*\.automa\.site/i,
    /automa.*backup/i,
    /backup.*automa/i
  ];

  // Keywords in URLs to block
  const BLOCKED_KEYWORDS = [
    'automa-backup',
    'automa-sync',
    'automa-cloud',
    'workflow-backup',
    'workflow-sync',
    'cloud-backup'
  ];

  // Allowed Google API domains
  const ALLOWED_GOOGLE_DOMAINS = [
    'accounts.google.com',
    'oauth2.googleapis.com',
    'www.googleapis.com',
    'sheets.googleapis.com',
    'drive.googleapis.com',
    'content.googleapis.com',
    'storage.googleapis.com'
  ];

  /**
   * Check if a URL should be blocked
   */
  function shouldBlock(url) {
    if (!url) return false;
    
    try {
      const urlString = url.toString().toLowerCase();
      const urlObj = new URL(urlString);
      const hostname = urlObj.hostname.toLowerCase();
      const fullUrl = urlObj.href.toLowerCase();

      // Always allow Google APIs
      for (const domain of ALLOWED_GOOGLE_DOMAINS) {
        if (hostname.includes(domain) || hostname.endsWith(domain)) {
          return false;
        }
      }

      // Block specific domains
      for (const domain of BLOCKED_DOMAINS) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          console.warn(`[Network Guard] 🚫 Blocked domain: ${hostname}`);
          return true;
        }
      }

      // Block by pattern
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(hostname) || pattern.test(fullUrl)) {
          console.warn(`[Network Guard] 🚫 Blocked pattern match: ${hostname}`);
          return true;
        }
      }

      // Block by keywords
      for (const keyword of BLOCKED_KEYWORDS) {
        if (fullUrl.includes(keyword)) {
          console.warn(`[Network Guard] 🚫 Blocked keyword: ${keyword} in ${hostname}`);
          return true;
        }
      }

      return false;
    } catch (e) {
      // If URL parsing fails, don't block
      return false;
    }
  }

  /**
   * Create a blocked response
   */
  function createBlockedResponse() {
    return new Response(JSON.stringify({ 
      error: 'Request blocked by Network Guard',
      blocked: true 
    }), {
      status: 403,
      statusText: 'Blocked by Network Guard',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Store original functions
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const OriginalWebSocket = window.WebSocket;

  /**
   * Override fetch
   */
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || input?.href || '');
    
    if (shouldBlock(url)) {
      console.warn(`[Network Guard] 🚫 Blocked fetch: ${url}`);
      return Promise.resolve(createBlockedResponse());
    }
    
    return originalFetch.apply(this, arguments);
  };

  /**
   * Override XMLHttpRequest
   */
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._guardUrl = url;
    this._guardBlocked = shouldBlock(url);
    
    if (this._guardBlocked) {
      console.warn(`[Network Guard] 🚫 Blocked XHR: ${url}`);
    }
    
    return originalXHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(data) {
    if (this._guardBlocked) {
      // Simulate a failed request
      setTimeout(() => {
        Object.defineProperty(this, 'status', { value: 403 });
        Object.defineProperty(this, 'statusText', { value: 'Blocked' });
        Object.defineProperty(this, 'responseText', { 
          value: JSON.stringify({ error: 'Blocked by Network Guard' }) 
        });
        this.dispatchEvent(new Event('error'));
        if (this.onerror) this.onerror(new Error('Blocked by Network Guard'));
      }, 0);
      return;
    }
    
    return originalXHRSend.call(this, data);
  };

  /**
   * Override WebSocket
   */
  window.WebSocket = function(url, protocols) {
    if (shouldBlock(url)) {
      console.warn(`[Network Guard] 🚫 Blocked WebSocket: ${url}`);
      throw new Error('WebSocket blocked by Network Guard');
    }
    return new OriginalWebSocket(url, protocols);
  };
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  window.WebSocket.OPEN = OriginalWebSocket.OPEN;
  window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

  /**
   * Override sendBeacon
   */
  if (navigator.sendBeacon) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data) {
      if (shouldBlock(url)) {
        console.warn(`[Network Guard] 🚫 Blocked sendBeacon: ${url}`);
        return false;
      }
      return originalBeacon(url, data);
    };
  }

  /**
   * Override Image (for tracking pixels)
   */
  const OriginalImage = window.Image;
  window.Image = function(width, height) {
    const img = new OriginalImage(width, height);
    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
    
    Object.defineProperty(img, 'src', {
      set: function(value) {
        if (shouldBlock(value)) {
          console.warn(`[Network Guard] 🚫 Blocked image: ${value}`);
          return;
        }
        originalSrcSetter.call(this, value);
      },
      get: function() {
        return this.getAttribute('src');
      }
    });
    
    return img;
  };

  // Log initialization
  console.log('[Network Guard] ✅ Initialized');
  console.log('[Network Guard] 📋 Blocking domains:', BLOCKED_DOMAINS.length);
  console.log('[Network Guard] ✅ Allowing Google APIs:', ALLOWED_GOOGLE_DOMAINS.length);
  
  // Expose for debugging
  window.__networkGuard = {
    shouldBlock,
    BLOCKED_DOMAINS,
    BLOCKED_PATTERNS,
    ALLOWED_GOOGLE_DOMAINS,
    version: '2.0.0'
  };

})();
