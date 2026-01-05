(function () {
  "use strict";
  // Dashboard UI cleanup only (no workflow logic changes).
  // Runs only on newtab.html and safely hides/removes a few unwanted UI bits.

  if (!/\/newtab\.html$/i.test(location.pathname)) return;

  // Small helpers
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const safeRemove = (el) => { try { el && el.remove(); } catch (_) {} };

  function removeCommunitiesItem() {
    // "Communities" tends to be a sidebar link. We remove only the matching row.
    // We match by visible text to avoid relying on fragile class names.
    const candidates = $$("a,button,li,div,span");
    for (const node of candidates) {
      const text = (node.textContent || "").trim();
      if (text === "Communities") {
        const row = node.closest("a,button,li") || node;
        safeRemove(row);
      }
    }
  }

  function removeBackupWorkflowsText() {
    // Remove ONLY the UI entry/label, not any storage or workflow code.
    const nodes = $$("*");
    for (const n of nodes) {
      const t = (n.textContent || "").trim();
      if (t === "Backup Workflows" || t === "Backup workflows") {
        safeRemove(n.closest("a,button,li,div") || n);
      }
    }
  }

  function inSettingsAbout() {
    const h = (location.hash || "").toLowerCase();
    if (h.includes("about")) return true;

    // Fallback heuristic (kept intentionally loose):
    // If the page is Settings and About is visible, we consider it the About area.
    const bt = document.body ? (document.body.textContent || "") : "";
    return /Settings/i.test(bt) && /\bAbout\b/i.test(bt);
  }

  function hideVersionLine() {
    // Hide the "Version:" line without removing the surrounding About content.
    for (const n of $$("p,div,span")) {
      const t = (n.textContent || "").trim();
      if (/^Version\s*:/i.test(t)) n.style.display = "none";
    }
  }

  function removeSocialIconRow() {
    // About page often contains a row of external icon-only links.
    // We remove only the external links and, if it becomes empty, its container.
    const links = $$('a[href^="http://"], a[href^="https://"]');

    const iconOnlyLinks = links.filter(a => {
      const text = (a.textContent || "").trim();
      // icon-only: no visible label text
      if (text.length) return false;
      // exclude normal buttons that have aria-label but might still be meaningful
      return true;
    });

    const parents = new Set();
    for (const a of iconOnlyLinks) {
      parents.add(a.parentElement);
      safeRemove(a);
    }

    // If a parent is now empty (or contains only whitespace), remove it.
    for (const p of parents) {
      if (!p) continue;
      const remainingText = (p.textContent || "").trim();
      const remainingLinks = p.querySelectorAll("a").length;
      if (!remainingText && remainingLinks === 0) safeRemove(p);
    }
  }

  function removeContributorsAndTranslatorsSections() {
    // Remove sections by heading text, then remove the section container.
    const headings = $$("h1,h2,h3,h4,h5,h6");
    for (const h of headings) {
      const t = (h.textContent || "").trim().toLowerCase();
      if (t === "contributors" || t === "translators") {
        // Remove the nearest section/card-like wrapper
        const wrap = h.closest("section,article,div") || h.parentElement;
        safeRemove(wrap);
      }
    }
  }

  let timer = null;
  function runCleanup() {
    timer = null;

    removeCommunitiesItem();
    removeBackupWorkflowsText();

    if (inSettingsAbout()) {
      removeSocialIconRow();
      removeContributorsAndTranslatorsSections();
      hideVersionLine();
    }
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(runCleanup, 80);
  }

  // React/Vue style apps update DOM frequently. Observe and re-apply.
  window.addEventListener("hashchange", schedule, { passive: true });
  window.addEventListener("popstate", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule, { passive: true });

  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run
  schedule();
})();