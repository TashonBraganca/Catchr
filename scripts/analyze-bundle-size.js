#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 *
 * Analyzes the production build and identifies optimization opportunities
 *
 * Usage:
 *   node scripts/analyze-bundle-size.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../client/dist');
const THRESHOLDS = {
  totalSize: 1024 * 1024, // 1MB
  jsBundle: 500 * 1024, // 500KB
  cssBundle: 100 * 1024, // 100KB
  vendorBundle: 300 * 1024, // 300KB
};

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get all files in directory recursively
 */
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analyze bundle
 */
function analyzeBundles() {
  console.log('🔍 Analyzing bundle sizes...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = getFiles(DIST_DIR);
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const assetFiles = files.filter((f) =>
    !f.endsWith('.js') && !f.endsWith('.css') && !f.endsWith('.html')
  );

  // Calculate sizes
  const jsSizes = jsFiles.map((file) => ({
    name: path.basename(file),
    size: getFileSize(file),
    path: file,
  }));

  const cssSizes = cssFiles.map((file) => ({
    name: path.basename(file),
    size: getFileSize(file),
    path: file,
  }));

  const assetSizes = assetFiles.map((file) => ({
    name: path.basename(file),
    size: getFileSize(file),
    path: file,
  }));

  const totalJsSize = jsSizes.reduce((sum, f) => sum + f.size, 0);
  const totalCssSize = cssSizes.reduce((sum, f) => sum + f.size, 0);
  const totalAssetSize = assetSizes.reduce((sum, f) => sum + f.size, 0);
  const totalSize = totalJsSize + totalCssSize + totalAssetSize;

  // Print results
  console.log('📦 BUNDLE SIZE REPORT');
  console.log('═'.repeat(60));
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log(`JavaScript: ${formatBytes(totalJsSize)}`);
  console.log(`CSS: ${formatBytes(totalCssSize)}`);
  console.log(`Assets: ${formatBytes(totalAssetSize)}`);
  console.log('');

  // JavaScript bundles
  console.log('📜 JavaScript Bundles');
  console.log('─'.repeat(60));
  jsSizes
    .sort((a, b) => b.size - a.size)
    .forEach((file) => {
      const status = file.size > THRESHOLDS.jsBundle ? '⚠️ ' : '✅';
      const sizeStr = formatBytes(file.size).padEnd(10);
      console.log(`${status} ${sizeStr} ${file.name}`);
    });
  console.log('');

  // CSS bundles
  console.log('🎨 CSS Bundles');
  console.log('─'.repeat(60));
  cssSizes
    .sort((a, b) => b.size - a.size)
    .forEach((file) => {
      const status = file.size > THRESHOLDS.cssBundle ? '⚠️ ' : '✅';
      const sizeStr = formatBytes(file.size).padEnd(10);
      console.log(`${status} ${sizeStr} ${file.name}`);
    });
  console.log('');

  // Largest assets
  const largestAssets = assetSizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  if (largestAssets.length > 0) {
    console.log('🖼️  Largest Assets (Top 10)');
    console.log('─'.repeat(60));
    largestAssets.forEach((file) => {
      const sizeStr = formatBytes(file.size).padEnd(10);
      console.log(`   ${sizeStr} ${file.name}`);
    });
    console.log('');
  }

  // Recommendations
  console.log('💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('─'.repeat(60));

  const recommendations = [];

  if (totalSize > THRESHOLDS.totalSize) {
    recommendations.push(
      `⚠️  Total bundle size (${formatBytes(totalSize)}) exceeds ${formatBytes(
        THRESHOLDS.totalSize
      )}`
    );
    recommendations.push('   → Consider code splitting and lazy loading');
  }

  const largeJsBundle = jsSizes.find((f) => f.size > THRESHOLDS.jsBundle);
  if (largeJsBundle) {
    recommendations.push(
      `⚠️  JavaScript bundle too large: ${formatBytes(largeJsBundle.size)}`
    );
    recommendations.push('   → Analyze with `npm run build -- --analyze`');
    recommendations.push('   → Use dynamic imports for routes');
    recommendations.push('   → Tree-shake unused dependencies');
  }

  const largeCssBundle = cssSizes.find((f) => f.size > THRESHOLDS.cssBundle);
  if (largeCssBundle) {
    recommendations.push(
      `⚠️  CSS bundle too large: ${formatBytes(largeCssBundle.size)}`
    );
    recommendations.push('   → Use PurgeCSS to remove unused styles');
    recommendations.push('   → Enable CSS minification');
  }

  const largeAsset = assetSizes.find((f) => f.size > 200 * 1024);
  if (largeAsset) {
    recommendations.push(
      `⚠️  Large asset detected: ${largeAsset.name} (${formatBytes(
        largeAsset.size
      )})`
    );
    recommendations.push('   → Optimize images (WebP, compression)');
    recommendations.push('   → Use CDN for large assets');
  }

  if (recommendations.length === 0) {
    console.log('✅ All bundles are within recommended size limits!');
  } else {
    recommendations.forEach((rec) => console.log(rec));
  }

  console.log('');
  console.log('═'.repeat(60));

  // Exit with error if over limits
  if (recommendations.length > 0) {
    console.log('⚠️  Some bundles exceed recommended sizes');
    process.exit(1);
  } else {
    console.log('✅ Bundle analysis complete');
    process.exit(0);
  }
}

// Run analysis
analyzeBundles();
