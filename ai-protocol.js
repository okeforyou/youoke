#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const https = require('https');
const crypto = require('crypto');

// ============================================================================
// AI DEVELOPER INSTRUCTION: 
// If you are an AI Agent adding a new feature or fixing a bug in this file,
// you MUST increment the PROTOCOL_VERSION below AND the version in package.json.
// ============================================================================
const PROTOCOL_VERSION = "1.1.13";

const args = process.argv.slice(2);
const command = args[0];

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function getProjectRoot() {
  let current = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(current, '.ai')) || fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  if (fs.existsSync(path.join(__dirname, '.ai'))) {
    return __dirname;
  }
  return process.cwd();
}

const projectRoot = getProjectRoot();

function log(color, msg) {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function ensureDir(dir) {
  if (fs.existsSync(dir)) {
    const stats = fs.lstatSync(dir);
    if (stats.isSymbolicLink()) {
      throw new Error(`Security Error: Path is a symbolic link, which is not allowed for directories: ${dir}`);
    }
    if (!stats.isDirectory()) {
      throw new Error(`Path exists but is not a directory: ${dir}`);
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFolderSync(from, to) {
  ensureDir(to);
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      // Safety check: Do not overwrite existing files to protect user's custom docs/prompts
      if (!fs.existsSync(toPath)) {
        fs.copyFileSync(fromPath, toPath);
      }
    }
  });
}

function atomicWriteSync(filePath, content, options = {}) {
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  const tempPath = `${filePath}.tmp.${randomSuffix}`;
  const safeOptions = { ...options, flag: 'wx' };
  try {
    fs.writeFileSync(tempPath, content, safeOptions);
    try {
      fs.renameSync(tempPath, filePath);
    } catch (renameErr) {
      if (renameErr.code === 'EBUSY' || renameErr.code === 'EPERM' || renameErr.code === 'EACCES') {
        try {
          fs.writeFileSync(filePath, content, options);
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      } else {
        throw renameErr;
      }
    }
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

function atomicCopySync(srcPath, destPath) {
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  const tempPath = `${destPath}.tmp.${randomSuffix}`;
  try {
    fs.copyFileSync(srcPath, tempPath, fs.constants.COPYFILE_EXCL);
    try {
      fs.renameSync(tempPath, destPath);
    } catch (renameErr) {
      if (renameErr.code === 'EBUSY' || renameErr.code === 'EPERM' || renameErr.code === 'EACCES') {
        try {
          fs.copyFileSync(tempPath, destPath);
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      } else {
        throw renameErr;
      }
    }
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

function downloadFile(url, dest, validateSyntax = false) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (validateSyntax) {
            // Write to a temporary file to validate syntax safely
            const randomSuffix = crypto.randomBytes(16).toString('hex');
            const tempDest = `${dest}.${randomSuffix}.tmp.js`;
            fs.writeFileSync(tempDest, data, { flag: 'wx' });
            try {
              execFileSync('node', ['-c', tempDest], { stdio: 'ignore' });
            } catch (err) {
              fs.unlinkSync(tempDest);
              return reject(new Error(`Syntax error in downloaded file ${url}. Aborting update to prevent corruption.`));
            }
            fs.unlinkSync(tempDest);
          }
          atomicWriteSync(dest, data);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function checkUpdate() {
  return new Promise((resolve) => {
    const req = https.get('https://raw.githubusercontent.com/boonyanone/ai-coding-protocol/main/ai-protocol.js', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const match = data.match(/const PROTOCOL_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (match && match[1] && match[1] !== PROTOCOL_VERSION) {
          log('yellow', `\n💡 Update Available! A new version of AI Protocol (${match[1]}) is available.`);
          log('cyan', `👉 Run './ai-protocol.sh update' to upgrade.\n`);
        }
        resolve();
      });
    });
    req.on('error', () => resolve()); // Ignore errors silently
    req.setTimeout(2000, () => {
      req.abort();
      resolve();
    });
  });
}

async function update() {
  log('cyan', '🔄 Updating AI Protocol...');
  
  const filesToUpdate = [
    { url: 'https://raw.githubusercontent.com/boonyanone/ai-coding-protocol/main/ai-protocol.js', dest: path.join(projectRoot, 'ai-protocol.js') },
    { url: 'https://raw.githubusercontent.com/boonyanone/ai-coding-protocol/main/ai-protocol.sh', dest: path.join(projectRoot, 'ai-protocol.sh') },
    { url: 'https://raw.githubusercontent.com/boonyanone/ai-coding-protocol/main/.cursorrules', dest: path.join(projectRoot, '.cursorrules') }
  ];

  try {
    for (const file of filesToUpdate) {
      log('blue', `⬇️ Downloading ${path.basename(file.dest)}...`);
      // Only validate syntax for ai-protocol.js
      const requiresValidation = file.dest.endsWith('ai-protocol.js');
      await downloadFile(file.url, file.dest, requiresValidation);
    }
    
    // Ensure the shell script is executable safely
    const shPath = path.join(projectRoot, 'ai-protocol.sh');
    if (fs.existsSync(shPath) && !fs.lstatSync(shPath).isSymbolicLink()) {
      fs.chmodSync(shPath, 0o755);
    }
    
    // Ensure the JS script remains executable for global CLI usage
    const jsPath = path.join(projectRoot, 'ai-protocol.js');
    if (fs.existsSync(jsPath) && !fs.lstatSync(jsPath).isSymbolicLink()) {
      fs.chmodSync(jsPath, 0o755);
    }
    
    log('green', '✅ Update complete! AI Protocol is now up to date.');
  } catch (err) {
    log('red', `❌ Update failed: ${err.message}`);
  }
}

function init() {
  log('cyan', '🤖 Initializing AI Protocol in the current directory...');
  
  const targetDir = process.cwd();
  const sourceDir = __dirname;
  const isSelf = path.resolve(targetDir).toLowerCase() === path.resolve(sourceDir).toLowerCase();
  
  if (isSelf) {
    log('yellow', '⚠️ Warning: Initializing inside the framework directory itself.');
  }

  // 1. Create target directories
  ensureDir(path.join(targetDir, '.ai'));
  ensureDir(path.join(targetDir, '.ai/templates'));
  ensureDir(path.join(targetDir, '.ai/templates/ui'));
  ensureDir(path.join(targetDir, '.ai/docs'));
  ensureDir(path.join(targetDir, '.ai/docs/api_contracts'));
  ensureDir(path.join(targetDir, '.ai/prompts'));

  // 2. Copy files from framework source to target (if not running on self)
  if (!isSelf) {
    log('cyan', '📦 Copying templates, prompts, and default documentation...');
    try {
      copyFolderSync(path.join(sourceDir, '.ai/templates'), path.join(targetDir, '.ai/templates'));
      copyFolderSync(path.join(sourceDir, '.ai/prompts'), path.join(targetDir, '.ai/prompts'));
      copyFolderSync(path.join(sourceDir, '.ai/docs'), path.join(targetDir, '.ai/docs'));
      
      const cursorrulesSrc = path.join(sourceDir, '.cursorrules');
      if (fs.existsSync(cursorrulesSrc)) {
        // IDE config files: only copy if they don't already exist (protect user customizations)
        const ideConfigs = [
          { dest: '.cursorrules' },
          { dest: '.windsurfrules' },
          { dest: '.clinerules' },
          { dest: '.clauderules' },
          { dest: '.claudecoderc' },
          { dest: 'SKILL.md' },
        ];
        ideConfigs.forEach(({ dest }) => {
          const targetPath = path.join(targetDir, dest);
          if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(cursorrulesSrc, targetPath);
          }
        });
        
        ensureDir(path.join(targetDir, '.github'));
        const copilotPath = path.join(targetDir, '.github/copilot-instructions.md');
        if (!fs.existsSync(copilotPath)) {
          fs.copyFileSync(cursorrulesSrc, copilotPath);
        }
        
        // Setup IDE Tasks Integration
        ensureDir(path.join(targetDir, '.vscode'));
        const tasksSrc = path.join(sourceDir, '.ai/templates/tasks.json');
        const tasksDest = path.join(targetDir, '.vscode/tasks.json');
        if (fs.existsSync(tasksSrc) && !fs.existsSync(tasksDest)) {
          fs.copyFileSync(tasksSrc, tasksDest);
        }
        
        // Setup .gitignore if it doesn't exist
        const gitignoreSrc = path.join(sourceDir, '.gitignore');
        const gitignoreDest = path.join(targetDir, '.gitignore');
        if (fs.existsSync(gitignoreSrc) && !fs.existsSync(gitignoreDest)) {
          fs.copyFileSync(gitignoreSrc, gitignoreDest);
        }
        
        // Copy CLI Scripts to target directory so user can run them locally
        const shSrc = path.join(sourceDir, 'ai-protocol.sh');
        const jsSrc = path.join(sourceDir, 'ai-protocol.js');
        if (fs.existsSync(shSrc) && fs.existsSync(jsSrc)) {
          fs.copyFileSync(shSrc, path.join(targetDir, 'ai-protocol.sh'));
          fs.copyFileSync(jsSrc, path.join(targetDir, 'ai-protocol.js'));
          if (!fs.lstatSync(path.join(targetDir, 'ai-protocol.sh')).isSymbolicLink()) {
            fs.chmodSync(path.join(targetDir, 'ai-protocol.sh'), 0o755);
          }
        }
        
        // Drop HOW_TO_USE.md in the project root
        const howToUseSrc = path.join(sourceDir, '.ai/templates/HOW_TO_USE.md');
        const howToUseDest = path.join(targetDir, 'HOW_TO_USE.md');
        if (fs.existsSync(howToUseSrc) && !fs.existsSync(howToUseDest)) {
          fs.copyFileSync(howToUseSrc, howToUseDest);
        }
        
        log('green', '✅ Created multi-IDE config files (.cursorrules, .windsurfrules, .clinerules, .clauderules, .claudecoderc, SKILL.md, copilot-instructions.md).');
        log('green', '✅ Installed ai-protocol.sh CLI tool in your project.');
      }
      
      log('green', '✅ Copied templates, prompts, and docs successfully.');
    } catch (err) {
      log('red', `❌ Error copying framework files: ${err.message}`);
    }
  }

  // 3. Instantiate active RAM files from templates if they do not exist
  const statePath = path.join(targetDir, '.ai/STATE.md');
  const reflectionsPath = path.join(targetDir, '.ai/REFLECTIONS.md');
  const decisionsPath = path.join(targetDir, '.ai/DECISIONS.md');

  const stateTemplate = path.join(targetDir, '.ai/templates/STATE.template.md');
  const reflectionsTemplate = path.join(targetDir, '.ai/templates/REFLECTIONS.template.md');
  const decisionsTemplate = path.join(targetDir, '.ai/templates/DECISIONS.template.md');

  if (!fs.existsSync(statePath) && fs.existsSync(stateTemplate)) {
    fs.copyFileSync(stateTemplate, statePath);
    log('green', '✅ Instantiated .ai/STATE.md from template.');
  }
  if (!fs.existsSync(reflectionsPath) && fs.existsSync(reflectionsTemplate)) {
    fs.copyFileSync(reflectionsTemplate, reflectionsPath);
    log('green', '✅ Instantiated .ai/REFLECTIONS.md from template.');
  }
  if (!fs.existsSync(decisionsPath) && fs.existsSync(decisionsTemplate)) {
    fs.copyFileSync(decisionsTemplate, decisionsPath);
    log('green', '✅ Instantiated .ai/DECISIONS.md from template.');
  }

  log('green', '🎉 AI Protocol initialization complete!');
}

async function check() {
  log('cyan', '🔍 Running AI Protocol Compliance Check...');
  let hasError = false;

  // 1. Check .gitignore & Git active tracking for .env files
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const lines = gitignore.split(/\r?\n/).map(l => l.trim());
    if (!lines.includes('.env') && !lines.includes('*.env') && !lines.includes('.env.*')) {
      log('red', '❌ Security Warning: .env is missing from .gitignore!');
      hasError = true;
    } else {
      log('green', '✅ .gitignore secures .env files');
    }
  } else {
    log('yellow', '⚠️ No .gitignore found.');
  }

  // Active Git tracking check for .env* to prevent accidental commit of any secret files
  const gitPath = path.join(projectRoot, '.git');
  if (fs.existsSync(gitPath)) {
    try {
      const trackedEnv = execSync('git ls-files ".env*"', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (trackedEnv) {
        const envFiles = trackedEnv.split(/\r?\n/).filter(f => !f.endsWith('.example') && !f.endsWith('.sample') && !f.endsWith('.template'));
        if (envFiles.length > 0) {
          log('red', `❌ Security Danger: The following secret files are currently tracked by Git!`);
          envFiles.forEach(f => log('red', `   - ${f}`));
          log('red', `   Run "git rm --cached <file>" immediately to stop tracking them!`);
          hasError = true;
        }
      }
    } catch (e) {
      // Git command failed, ignore
    }
  }

  // 2. Check STATE.md
  const statePath = path.join(projectRoot, '.ai/STATE.md');
  if (fs.existsSync(statePath)) {
    const state = fs.readFileSync(statePath, 'utf8');
    const lines = state.split(/\r?\n/).length;
    if (lines > 20) {
      log('yellow', `⚠️ STATE.md is getting bloated (${lines} lines). Keep it under 20 lines for token efficiency.`);
      hasError = true;
    } else {
      log('green', `✅ STATE.md size is optimal (${lines} lines).`);
    }
  }

  // 3. Check REFLECTIONS.md
  const reflectionsPath = path.join(projectRoot, '.ai/REFLECTIONS.md');
  if (fs.existsSync(reflectionsPath)) {
    const reflections = fs.readFileSync(reflectionsPath, 'utf8');
    // Count entries (assuming they start with ### or - ** with optional leading whitespace)
    const entries = (reflections.match(/^[ \t]*(?:### |- \*\*)/gm) || []).length;
    if (entries > 15) {
      log('yellow', `⚠️ REFLECTIONS.md has ${entries} entries (Limit: 15). Run 'ai-protocol prune' to archive older entries.`);
      hasError = true;
    } else {
      log('green', `✅ REFLECTIONS.md has ${entries} entries.`);
    }
  }

  if (!hasError) {
    log('green', '🎉 All checks passed! Your AI workspace is optimized.');
  } else {
    log('yellow', '👀 Please review the warnings above to maintain peak AI efficiency.');
  }

  await checkUpdate();
}

function prune() {
  log('cyan', '🧹 Pruning REFLECTIONS.md...');
  const refPath = path.join(projectRoot, '.ai/REFLECTIONS.md');
  const archPath = path.join(projectRoot, '.ai/docs/reflections_archive.md');
  
  if (!fs.existsSync(refPath)) {
    log('yellow', 'No REFLECTIONS.md found.');
    return;
  }

  const content = fs.readFileSync(refPath, 'utf8');
  const sections = content.split(/^(?=[ \t]*(?:### |- \*\*))/m);
  
  // First section is usually header
  const header = sections[0];
  const entries = sections.slice(1);
  
  if (entries.length <= 15) {
    log('green', `✅ Only ${entries.length} entries found. No pruning needed.`);
    return;
  }
  
  const keep = entries.slice(0, 15);
  const archive = entries.slice(15);
  
  ensureDir(path.join(projectRoot, '.ai/docs'));
  if (!fs.existsSync(archPath)) {
    atomicWriteSync(archPath, '# 🗄️ Reflections Archive\n\n');
  }
  
  // Transactional Write: Archive first, then truncate original
  fs.appendFileSync(archPath, archive.join(''));
  atomicWriteSync(refPath, header + keep.join(''));
  
  log('green', `✅ Pruned ${archive.length} entries and moved them to reflections_archive.md.`);
}

function clean() {
  log('cyan', '🧼 Cleaning STATE.md for a new session...');
  ensureDir(path.join(projectRoot, '.ai/docs/state_history'));
  
  const statePath = path.join(projectRoot, '.ai/STATE.md');
  if (fs.existsSync(statePath)) {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(projectRoot, `.ai/docs/state_history/STATE_${date}.md`);
    try {
      atomicCopySync(statePath, backupPath);
      log('green', `✅ Backed up current STATE.md to ${backupPath}`);
    } catch (err) {
      log('yellow', `⚠️ Warning: Failed to backup STATE.md: ${err.message}`);
    }
  }

  const templatePath = path.join(projectRoot, '.ai/templates/STATE.template.md');
  if (fs.existsSync(templatePath)) {
    atomicCopySync(templatePath, statePath);
    log('green', `✅ Reset STATE.md from template.`);
  } else {
    atomicWriteSync(statePath, '# 📍 Active State (RAM)\n\n## 🚀 Current Objective\n\n## 📋 Action Plan\n');
    log('yellow', `⚠️ Template not found. Created generic STATE.md.`);
  }
}

function installHook() {
  log('cyan', '🪝 Installing Git pre-commit hook...');
  const gitPath = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitPath)) {
    log('red', '❌ Error: .git directory not found. Please run "git init" first.');
    return;
  }
  ensureDir(path.join(projectRoot, '.git/hooks'));
  const hookPath = path.join(projectRoot, '.git/hooks/pre-commit');
  const hookLine = './ai-protocol.sh check';
  
  if (fs.existsSync(hookPath)) {
    if (fs.lstatSync(hookPath).isSymbolicLink()) {
      log('red', '❌ Error: pre-commit hook is a symbolic link. Cannot modify safely.');
      return;
    }
    const currentContent = fs.readFileSync(hookPath, 'utf8');
    if (currentContent.includes('ai-protocol.sh check') || currentContent.includes('ai-protocol check')) {
      log('green', '✅ Pre-commit hook already contains AI Protocol check. Skipping.');
      return;
    }
    // Append to existing hook safely without overwriting user scripts
    const newContent = currentContent.endsWith('\n') 
      ? `${currentContent}\n# AI Coding Protocol Hook\n${hookLine}\n`
      : `${currentContent}\n\n# AI Coding Protocol Hook\n${hookLine}\n`;
    atomicWriteSync(hookPath, newContent, { mode: 0o755 });
    log('green', '✅ Pre-commit hook updated with AI Protocol check (Appended safely).');
  } else {
    // Create new hook
    const hookContent = `#!/bin/sh
# AI Coding Protocol Pre-commit Hook

echo "🤖 Running AI Protocol Check..."
${hookLine}

if [ $? -ne 0 ]; then
  echo "❌ AI Protocol Check Failed. Please fix the warnings."
  # Uncomment the next line to block commits if check fails
  # exit 1
fi
exit 0
`;
    atomicWriteSync(hookPath, hookContent, { mode: 0o755 });
    log('green', '✅ Pre-commit hook installed successfully! (Currently non-blocking)');
  }
}

function handoff() {
  log('cyan', '🤝 Generating AI Handoff Prompt...');

  const statePath = path.join(projectRoot, '.ai/STATE.md');
  let stateContent = '*(No active state found)*';
  if (fs.existsSync(statePath)) {
    stateContent = fs.readFileSync(statePath, 'utf8').trim();
  }

  const reflectionsPath = path.join(projectRoot, '.ai/REFLECTIONS.md');
  let recentReflections = '*(No recent reflections logged)*';
  if (fs.existsSync(reflectionsPath)) {
    const reflections = fs.readFileSync(reflectionsPath, 'utf8');
    const sections = reflections.split(/^(?=[ \t]*(?:### |- \*\*))/m);
    const entries = sections.slice(1);
    if (entries.length > 0) {
      recentReflections = entries.slice(0, 5).join('').trim();
    }
  }

  let gitStatus = '*(No changes)*';
  try {
    gitStatus = execSync('git status -s', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (gitStatus) {
      const gitLines = gitStatus.split(/\r?\n/);
      if (gitLines.length > 20) {
        gitStatus = gitLines.slice(0, 20).join('\n') + `\n... (+${gitLines.length - 20} more files)`;
      }
    } else {
      gitStatus = 'No uncommitted changes.';
    }
  } catch (err) {
    gitStatus = '*(Git not initialized or not found)*';
  }

  const decisionsPath = path.join(projectRoot, '.ai/DECISIONS.md');
  let decisionsContent = '*(No architectural decisions found)*';
  if (fs.existsSync(decisionsPath)) {
    const decisions = fs.readFileSync(decisionsPath, 'utf8').trim();
    // Only include if it has actual entries (not just the empty template)
    if (!decisions.includes('No architectural decisions yet')) {
      decisionsContent = decisions;
    }
  }

  const dateStr = new Date().toLocaleString();

  const handoffPrompt = `# 📌 Project Context & Handover (Generated: ${dateStr})

We are transferring active context for the repository. Please read the current RAM state, recent bug reflections, and modified files to understand the precise workspace state.

## 1. Current Active State (RAM)
\`\`\`markdown
${stateContent}
\`\`\`

## 2. Recent Bug Reflections (Past Mistakes to Avoid)
\`\`\`markdown
${recentReflections}
\`\`\`

## 3. Architectural Decisions (ADR)
\`\`\`markdown
${decisionsContent}
\`\`\`

## 4. Uncommitted Changes (Git Status)
\`\`\`text
${gitStatus || 'No uncommitted changes.'}
\`\`\`

---
**Your Instructions Now:**
1. Acknowledge that you fully understand the active objectives and state.
2. Formulate your progressive complexity action plan for the next steps.
3. Output \`[WAITING_FOR_USER]\` and wait for my instruction before writing any code.
`;

  try {
    ensureDir(path.join(projectRoot, '.ai'));
    atomicWriteSync(path.join(projectRoot, '.ai/HANDOFF.md'), handoffPrompt);
    log('green', '✅ Handoff prompt generated and saved to .ai/HANDOFF.md!');
    log('cyan', '👉 Please open .ai/HANDOFF.md, copy all contents, and paste it into your new AI session.');
  } catch (err) {
    log('red', `❌ Failed to save HANDOFF.md: ${err.message}`);
    // Fallback to console if file write fails
    console.log('\n----------------- COPY THE TEXT BELOW -----------------');
    console.log(handoffPrompt);
    console.log('-------------------------------------------------------\n');
  }
}

function dashboard() {
  log('blue', '\n==================================================');
  log('blue', '             🧠 AI SECOND BRAIN HUB             ');
  log('blue', '==================================================\n');

  log('cyan', '📍 PENDING TASKS (STATE.md)');
  const statePath = path.join(projectRoot, '.ai/STATE.md');
  if (fs.existsSync(statePath)) {
    const state = fs.readFileSync(statePath, 'utf8').trim();
    const stateLines = state.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('# 📍 Active State') && !line.startsWith('*Last Updated'));
    console.log(stateLines.slice(0, 10).join('\n') || '  (No pending tasks)');
    if (stateLines.length > 10) console.log('... (truncated)');
  } else {
    console.log('  (No active state)');
  }
  console.log('\n');

  log('yellow', '📚 RECENT REFLECTIONS');
  const reflectionsPath = path.join(projectRoot, '.ai/REFLECTIONS.md');
  if (fs.existsSync(reflectionsPath)) {
    const reflections = fs.readFileSync(reflectionsPath, 'utf8');
    const sections = reflections.split(/^(?=[ \t]*(?:### |- \*\*))/m).slice(1);
    if (sections.length > 0) {
      console.log(sections.slice(0, 3).join('').trim());
      if (sections.length > 3) console.log(`\n... (+${sections.length - 3} more entries)`);
    } else {
      console.log('  (No reflections)');
    }
  } else {
    console.log('  (No reflections file)');
  }
  console.log('\n');
  
  log('green', '🏗️ ARCHITECTURE DECISIONS');
  const decisionsPath = path.join(projectRoot, '.ai/DECISIONS.md');
  if (fs.existsSync(decisionsPath)) {
    const decisions = fs.readFileSync(decisionsPath, 'utf8').trim();
    if (!decisions.includes('No architectural decisions yet')) {
      const decisionLines = decisions.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('# 🏗️ Architectural Decisions'));
      console.log(decisionLines.slice(0, 5).join('\n') || '  (No major decisions recorded yet)');
      if (decisionLines.length > 5) console.log('... (truncated)');
    } else {
      console.log('  (No major decisions recorded yet)');
    }
  } else {
     console.log('  (No decisions file)');
  }
  
  console.log('\n');
  log('blue', '==================================================');
  log('reset', 'Commands: `ai-protocol handoff` | `ai-protocol clean` | `ai-protocol prune`\n');
}

async function installMcp() {
  log('blue', '🚀 Installing NotebookLM MCP Server...');
  const mcpDir = path.join(projectRoot, '.ai', 'mcp', 'notebooklm');

  try {
    // Check if git is installed
    try {
      execSync('git --version', { stdio: 'ignore' });
    } catch (e) {
      log('red', '❌ Git is not installed. Please install Git first.');
      return;
    }

    // Check if npm is installed
    try {
      execSync('npm --version', { stdio: 'ignore' });
    } catch (e) {
      log('red', '❌ Node.js/NPM is not installed. Please install Node.js first.');
      return;
    }

    if (fs.existsSync(mcpDir)) {
      log('yellow', `⚠️ MCP directory already exists. Replacing with the latest bundled version...`);
      fs.rmSync(mcpDir, { recursive: true, force: true });
    }
    
    ensureDir(path.join(projectRoot, '.ai', 'mcp'));
    const tempMcpDir = path.join(projectRoot, '.ai', 'mcp', 'temp-protocol-repo');
    if (fs.existsSync(tempMcpDir)) fs.rmSync(tempMcpDir, { recursive: true, force: true });

    log('reset', 'Downloading bundled NotebookLM MCP Server...');
    execFileSync('git', ['clone', '--depth', '1', 'https://github.com/boonyanone/ai-coding-protocol.git', tempMcpDir], { stdio: 'inherit' });
    fs.cpSync(path.join(tempMcpDir, 'notebooklm-mcp'), mcpDir, { recursive: true });
    fs.rmSync(tempMcpDir, { recursive: true, force: true });
    
    // Pre-create the credentials directory as a secure OS-level vault (Defense-in-Depth)
    const authDir = path.join(projectRoot, '.ai', 'mcp', 'auth');
    ensureDir(authDir);
    if (!fs.lstatSync(authDir).isSymbolicLink()) {
      fs.chmodSync(authDir, 0o700);
    }
    
    log('reset', 'Patching MCP to use project-local authentication...');
    try {
      const srcDir = path.join(mcpDir, 'src');
      if (fs.existsSync(srcDir)) {
        const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));
        for (const file of files) {
          const filePath = path.join(srcDir, file);
          if (fs.lstatSync(filePath).isSymbolicLink()) continue;
          let content = fs.readFileSync(filePath, 'utf8');
          // Add fileURLToPath import for ESM __dirname equivalent if not present
          if (!content.includes('fileURLToPath')) {
            content = "import { fileURLToPath } from 'url';\n" + content;
          }
          // 1. Replace all variations of home/.notebooklm-mcp path resolutions robustly
          content = content.replace(/path\.join\(\s*(?:home|os\.homedir\(\))\s*,\s*['"`]\.notebooklm-mcp['"`]/g, "path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'auth'");
          // 2. Harden file permissions: force auth.json to be created with 0o600 (owner read/write only)
          content = content.replace(/fs\.writeFileSync\(\s*authPath\s*,\s*JSON\.stringify\(\s*authData\s*,\s*null\s*,\s*2\s*\)\s*\)/g, "fs.writeFileSync(authPath, JSON.stringify(authData, null, 2), { mode: 0o600 })");
          // 3. Fix confusing UI logs to show the accurate project-local path
          content = content.replace(/~\/\.notebooklm-mcp\/auth\.json/g, ".ai/mcp/auth/auth.json");
          
          atomicWriteSync(filePath, content);
        }
      }
    } catch (err) {
      log('yellow', `⚠️ Failed to patch MCP auth directory: ${err.message}`);
    }

    log('reset', 'Installing dependencies...');
    execSync('npm install', { cwd: mcpDir, stdio: 'inherit' });
    
    log('reset', 'Building MCP server...');
    execSync('npm run build', { cwd: mcpDir, stdio: 'inherit' });
    
    // Generate IDE configurations (Cursor, Windsurf, Cline)
    const relativeMcpDir = ".ai/mcp/notebooklm";
    const mcpServerConfig = {
      command: "node",
      args: [`${relativeMcpDir}/build/index.js`]
    };

    const configs = [
      { dir: '.cursor', file: 'mcp.json', key: 'mcpServers' },
      { dir: '.windsurf', file: 'mcp.json', key: 'mcpServers' },
      { dir: '.vscode', file: 'cline_mcp_settings.json', key: 'mcpServers' }
    ];

    for (const conf of configs) {
      const configDir = path.join(projectRoot, conf.dir);
      const configFile = path.join(configDir, conf.file);
      fs.mkdirSync(configDir, { recursive: true });
      
      let mcpConfig = {};
      if (fs.existsSync(configFile)) {
        try {
          mcpConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch (e) {
          log('yellow', `Failed to parse existing ${configFile}, backing up.`);
          fs.copyFileSync(configFile, configFile + '.bak');
        }
      }
      
      if (!mcpConfig[conf.key]) mcpConfig[conf.key] = {};
      mcpConfig[conf.key]["notebooklm"] = mcpServerConfig;
      
      atomicWriteSync(configFile, JSON.stringify(mcpConfig, null, 2));
      log('green', `✅ Added MCP configuration to ${configFile}`);
    }

    // Update .gitignore to prevent leaking IDE configs and MCP source
    const gitignorePath = path.join(projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      let gitignore = fs.readFileSync(gitignorePath, 'utf8');
      let modified = false;
      const ignores = ['.cursor/', '.windsurf/', '.vscode/cline_mcp_settings.json', '.ai/mcp/'];
      for (const ignore of ignores) {
        if (!gitignore.includes(ignore)) {
          gitignore += `\n${ignore}`;
          modified = true;
        }
      }
      if (modified) {
        atomicWriteSync(gitignorePath, gitignore);
        log('green', `✅ Added IDE config paths to .gitignore`);
      }
    }
    
    log('green', '🎉 NotebookLM MCP Server installed successfully!');
    log('blue', '\n[ACTION REQUIRED] Authentication');
    log('reset', 'To use the MCP, you must authenticate your Google account.');
    log('reset', `Run the following command in your terminal:`);
    log('cyan', `./ai-protocol.sh auth-mcp`);
    
  } catch (error) {
    log('red', `❌ Installation failed: ${error.message}`);
  }
}

async function authMcp() {
  const authScript = path.join(projectRoot, '.ai', 'mcp', 'notebooklm', 'build', 'browser-auth.js');
  if (!fs.existsSync(authScript)) {
    log('red', `❌ MCP Server is not installed. Please run './ai-protocol.sh install-mcp' first.`);
    return;
  }
  log('blue', '🚀 Launching Browser for Authentication...');
  try {
    execFileSync('node', [authScript], { stdio: 'inherit' });
  } catch (error) {
    log('red', `❌ Authentication process failed or was interrupted.`);
  }
}

function globalInstall() {
  log('cyan', '🌍 Installing AI Protocol Globally...');
  if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
    log('red', '❌ package.json not found. Cannot create global link.');
    return;
  }
  try {
    execFileSync('npm', ['link'], { cwd: projectRoot, stdio: 'inherit' });
    log('green', '\n✅ Global install successful!');
    log('cyan', '👉 You can now run `ai-protocol` from any folder on your Mac without the "./"');
  } catch (error) {
    log('red', `❌ Global installation failed: ${error.message}`);
  }
}

function help() {
  log('blue', `🤖 AI Coding Protocol CLI Tool`);
  log('reset', `Usage: ./ai-protocol.sh [command]\n`);
  log('cyan', `Commands:`);
  log('reset', `  init         Initialize folder structure and copy templates`);
  log('reset', `  check        Run safety and token-efficiency checks`);
  log('reset', `  prune        Archive old reflections`);
  log('reset', `  clean        Backup and reset STATE.md`);
  log('reset', `  handoff      Generate a session handover prompt`);
  log('reset', `  dashboard    Open the AI Second Brain Terminal Dashboard`);
  log('reset', `  install-hook Install git pre-commit hook`);
  log('reset', `  install-mcp  Install NotebookLM MCP Server for Deep Research`);
  log('reset', `  auth-mcp     Launch browser to authenticate NotebookLM MCP`);
  log('reset', `  update       Update AI Protocol to the latest version`);
  log('reset', `  global-install Make ai-protocol available as a global command`);
}

async function run() {
  switch (command) {
    case 'init': await init(); break;
    case 'check': await check(); break;
    case 'prune': await prune(); break;
    case 'clean': await clean(); break;
    case 'handoff': await handoff(); break;
    case 'dashboard': await dashboard(); break;
    case 'install-hook': await installHook(); break;
    case 'install-mcp': await installMcp(); break;
    case 'auth-mcp': await authMcp(); break;
    case 'update': await update(); break;
    case 'global-install': await globalInstall(); break;
    default: help(); break;
  }
}

run();
