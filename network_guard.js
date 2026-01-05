(function () {
  "use strict";
  // Network guard for the Dashboard UI only.
  // Purpose: prevent known Automa cloud/telemetry endpoints and Google Drive "Backup Workflows" endpoints
  // from being called. This does NOT block normal website automation traffic.

  if (!/\/newtab\.html$/i.test(location.pathname)) return;

  const BLOCK_HOSTS = new Set([
    "automa.site",
    "www.automa.site",
    "api.automa.site",
    "automa.app",
    "www.automa.app",
    "api.automa.app",
    "automa-extension.vercel.app",
    "extension.automa.site",
    "docs.extension.automa.site",
    "blog.automa.site",
    "aipower.automa.site",
  ]);

  // Some Automa backup flows use Google endpoints; we block only those paths that match backup flows,
  // not all of Google.
  const BLOCK_URL_PATTERNS = [
    /https:\/\/www\.googleapis\.com\/drive\/v3\/files/i,
    /https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files/i,
    /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/i,
    /https:\/\/oauth2\.googleapis\.com\/token/i,
  ];

  function tryParseURL(u) {
    try { return new URL(u, location.href); } catch (_) { return null; }
  }

  function isBlocked(url) {
    const u = tryParseURL(url);
    if (!u) return false;

    const host = (u.hostname || "").toLowerCase();
    if (BLOCK_HOSTS.has(host)) return true;

    const full = u.toString();
    return BLOCK_URL_PATTERNS.some(rx => rx.test(full));
  }

  function blockedError() {
    return new Error("Blocked by Syar Automation: external service disabled");
  }

  // fetch
  const nativeFetch = globalThis.fetch;
  if (typeof nativeFetch === "function") {
    globalThis.fetch = function (input, init) {
      const url = (typeof input === "string") ? input : (input && input.url) ? input.url : "";
      if (url && isBlocked(url)) return Promise.reject(blockedError());
      return nativeFetch.apply(this, arguments);
    };
  }

  // XMLHttpRequest
  const XHR = globalThis.XMLHttpRequest;
  if (XHR && XHR.prototype && typeof XHR.prototype.open === "function") {
    const nativeOpen = XHR.prototype.open;
    const nativeSend = XHR.prototype.send;

    XHR.prototype.open = function (method, url) {
      try { this.__syar_blocked = isBlocked(String(url || "")); } catch (_) { this.__syar_blocked = false; }
      return nativeOpen.apply(this, arguments);
    };

    XHR.prototype.send = function () {
      if (this.__syar_blocked) {
        try { this.abort(); } catch (_) {}
        throw blockedError();
      }
      return nativeSend.apply(this, arguments);
    };
  }
})();