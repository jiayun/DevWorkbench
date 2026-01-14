#!/usr/bin/env node

/**
 * Pre-release check script for DevWorkbench
 * 
 * This script verifies that all required files are updated before creating a release:
 * - CHANGELOG.md has been updated with the new version
 * - Version numbers are consistent across package.json and tauri.conf.json
 * - No [Unreleased] section with content exists in CHANGELOG.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function checkChangelogUpdated() {
  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  const changelogContent = readFile(changelogPath);
  
  // Check if there's substantial content in the Unreleased section
  const unreleasedMatch = changelogContent.match(/## \[Unreleased\]\s*([\s\S]*?)(?=## \[|\[Unreleased\]:)/);
  
  if (unreleasedMatch) {
    const unreleasedContent = unreleasedMatch[1].trim();
    // If there's more than just empty lines and section headers, warn
    const contentLines = unreleasedContent.split('\n').filter(line => 
      line.trim() && !line.match(/^###\s*$/)
    );
    
    if (contentLines.length > 0) {
      console.warn('⚠️  Warning: CHANGELOG.md has unreleased changes that should be moved to the new version section');
      console.warn('   Unreleased content:');
      console.warn('   ' + unreleasedContent.replace(/\n/g, '\n   '));
      return false;
    }
  }
  
  return true;
}

function checkVersionConsistency() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageLockPath = path.join(projectRoot, 'package-lock.json');
  const tauriConfigPath = path.join(projectRoot, 'src-tauri/tauri.conf.json');

  const packageJson = JSON.parse(readFile(packageJsonPath));
  const packageLock = JSON.parse(readFile(packageLockPath));
  const tauriConfig = JSON.parse(readFile(tauriConfigPath));

  const packageVersion = packageJson.version;
  const packageLockVersion = packageLock.version;
  const tauriVersion = tauriConfig.version;

  const versions = [
    { name: 'package.json', version: packageVersion },
    { name: 'package-lock.json', version: packageLockVersion },
    { name: 'tauri.conf.json', version: tauriVersion }
  ];

  const allMatch = versions.every(v => v.version === packageVersion);

  if (!allMatch) {
    console.error(`❌ Version mismatch:`);
    versions.forEach(v => console.error(`   ${v.name}: ${v.version}`));
    return false;
  }

  console.log(`✅ Version consistency: ${packageVersion}`);
  return true;
}

function checkChangelogHasVersion(version) {
  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  const changelogContent = readFile(changelogPath);
  
  const versionPattern = new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\]`);
  
  if (!versionPattern.test(changelogContent)) {
    console.error(`❌ CHANGELOG.md does not contain version ${version}`);
    console.error(`   Please add a section: ## [${version}] - YYYY-MM-DD`);
    return false;
  }
  
  console.log(`✅ CHANGELOG.md contains version ${version}`);
  return true;
}

function main() {
  console.log('🔍 Running pre-release checks...\n');
  
  let allChecksPass = true;
  
  // Check version consistency
  if (!checkVersionConsistency()) {
    allChecksPass = false;
  }
  
  // Get the current version for further checks
  const packageJson = JSON.parse(readFile(path.join(projectRoot, 'package.json')));
  const currentVersion = packageJson.version;
  
  // Check if CHANGELOG.md has the current version
  if (!checkChangelogHasVersion(currentVersion)) {
    allChecksPass = false;
  }
  
  // Check if unreleased changes exist
  if (!checkChangelogUpdated()) {
    allChecksPass = false;
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allChecksPass) {
    console.log('✅ All pre-release checks passed!');
    console.log(`📦 Ready to release version ${currentVersion}`);
    console.log('\nNext steps:');
    console.log(`1. git tag v${currentVersion}`);
    console.log(`2. git push origin v${currentVersion}`);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before releasing.');
    process.exit(1);
  }
}

main();
