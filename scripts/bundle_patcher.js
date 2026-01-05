/**
 * Bundle Patcher - Removes Automa dependencies from bundled files
 * Run with: node scripts/bundle_patcher.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Syar-Automation Bundle Patcher v2.0.0\n');

// Files to patch
const BUNDLE_FILES = [
  'background.bundle.js',
  'newtab.bundle.js', 
  'contentScript.bundle.js',
  'popup.bundle.js',
  'index.bundle.js'
];

// Patterns to remove/replace
const PATTERNS = [
  // Automa domains
  { pattern: /["']https?:\/\/(www\.)?automa\.site[^"']*["']/g, replacement: '"about:blank"' },
  { pattern: /["']https?:\/\/[^"']*automa[^"']*\.vercel\.app[^"']*["']/g, replacement: '"about:blank"' },
  { pattern: /["']https?:\/\/api\.automa\.site[^"']*["']/g, replacement: '"about:blank"' },
  
  // Backup function calls
  { pattern: /\.backupWorkflows?\s*\(/g, replacement: '._disabledBackup(' },
  { pattern: /\.restoreWorkflows?\s*\(/g, replacement: '._disabledRestore(' },
  { pattern: /\.syncWorkflows?\s*\(/g, replacement: '._disabledSync(' },
  
  // Import statements
  { pattern: /import\s+.*from\s+["'][^"']*automa[^"']*["'];?/g, replacement: '/* [REMOVED] */' },
];

// Header to add to patched files
const PATCH_HEADER = `
// ============================================
// PATCHED by bundle_patcher.js
// Automa dependencies removed
// Backup functionality disabled
// ============================================
const BACKUP_WORKFLOWS_ENABLED = false;
const _disabledBackup = () => Promise.resolve({ success: false, reason: 'disabled' });
const _disabledRestore = () => Promise.resolve({ success: false, reason: 'disabled' });
const _disabledSync = () => Promise.resolve({ success: false, reason: 'disabled' });
// ============================================

`;

/**
 * Patch a single file
 */
function patchFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (not found)`);
    return null;
  }

  console.log(`📄 Processing ${filename}...`);

  // Create backup
  const backupDir = path.join(process.cwd(), '.backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, filename + '.backup');
  fs.copyFileSync(filePath, backupPath);
  console.log(`   📦 Backed up to .backup/${filename}.backup`);

  // Read and patch
  let content = fs.readFileSync(filePath, 'utf8');
  const originalSize = content.length;
  let patchCount = 0;

  PATTERNS.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      patchCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  });

  // Add header
  if (patchCount > 0) {
    content = PATCH_HEADER + content;
  }

  // Write patched file
  fs.writeFileSync(filePath, content);

  console.log(`   ✅ Applied ${patchCount} patches`);
  console.log(`   📊 Size: ${originalSize} → ${content.length} bytes`);

  return {
    file: filename,
    originalSize,
    patchedSize: content.length,
    patchCount
  };
}

/**
 * Generate report
 */
function generateReport(results) {
  const validResults = results.filter(r => r !== null);
  
  let report = `# Bundle Patching Report

**Generated:** ${new Date().toISOString()}
**Patcher Version:** 2.0.0

## Summary

| File | Original Size | Patched Size | Patches Applied |
|------|---------------|--------------|-----------------|
`;

  validResults.forEach(r => {
    report += `| ${r.file} | ${r.originalSize} | ${r.patchedSize} | ${r.patchCount} |\n`;
  });

  report += `
## Changes Made

1. **Removed Automa domain references**
   - automa.site
   - *.automa.site  
   - automa*.vercel.app

2. **Disabled backup functions**
   - backupWorkflows → disabled
   - restoreWorkflows → disabled
   - syncWorkflows → disabled

3. **Added feature flags**
   - BACKUP_WORKFLOWS_ENABLED = false

## Backups

Original files saved to \`.backup/\` directory.

## Next Steps

1. Test the extension in Chrome
2. Verify no network requests to blocked domains
3. Confirm backup UI is hidden

`;

  fs.writeFileSync('PATCHING_REPORT.md', report);
  console.log('\n📋 Report saved to PATCHING_REPORT.md');
}

// Run patcher
console.log('Starting patch process...\n');

const results = BUNDLE_FILES.map(patchFile);

generateReport(results);

const totalPatches = results
  .filter(r => r !== null)
  .reduce((sum, r) => sum + r.patchCount, 0);

console.log(`\n✅ Patching complete! Applied ${totalPatches} total patches.`);
