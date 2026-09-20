/**
 * Bump app version in app.json and android/app/build.gradle together.
 *
 * Usage:
 *   npm run bump              # patch (default)
 *   npm run bump:patch
 *   npm run bump:minor
 *   npm run bump:major
 *   node scripts/bump-version.js --code-only
 */

/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT, 'app.json');
const BUILD_GRADLE_PATH = path.join(ROOT, 'android', 'app', 'build.gradle');

function parseSemver(version) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semver version: "${version}" (expected major.minor.patch)`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpSemver(version, kind) {
  const parts = parseSemver(version);
  if (kind === 'major') {
    return formatSemver({ major: parts.major + 1, minor: 0, patch: 0 });
  }
  if (kind === 'minor') {
    return formatSemver({ major: parts.major, minor: parts.minor + 1, patch: 0 });
  }
  if (kind === 'patch') {
    return formatSemver({ major: parts.major, minor: parts.minor, patch: parts.patch + 1 });
  }
  throw new Error(`Unknown bump kind: "${kind}"`);
}

function readGradleVersions(gradleText) {
  const codeMatch = gradleText.match(/versionCode\s+(\d+)/);
  const nameMatch = gradleText.match(/versionName\s+"([^"]+)"/);
  if (!codeMatch || !nameMatch) {
    throw new Error('Could not find versionCode / versionName in android/app/build.gradle');
  }
  return {
    versionCode: Number(codeMatch[1]),
    versionName: nameMatch[1],
  };
}

function writeGradleVersions(gradleText, versionCode, versionName) {
  let next = gradleText.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  next = next.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
  return next;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const codeOnly = args.includes('--code-only');
  const kindArg = args.find((arg) => !arg.startsWith('--')) || 'patch';
  const allowed = new Set(['patch', 'minor', 'major']);
  if (!allowed.has(kindArg)) {
    throw new Error(
      `Invalid bump kind "${kindArg}". Use: patch | minor | major | --code-only`
    );
  }
  return { kind: kindArg, codeOnly };
}

function main() {
  const { kind, codeOnly } = parseArgs(process.argv);

  const appJsonRaw = fs.readFileSync(APP_JSON_PATH, 'utf8');
  const appJson = JSON.parse(appJsonRaw);
  const gradleText = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');
  const gradleVersions = readGradleVersions(gradleText);

  const currentVersion = appJson?.expo?.version;
  const currentCode = appJson?.expo?.android?.versionCode;

  if (typeof currentVersion !== 'string' || typeof currentCode !== 'number') {
    throw new Error('app.json is missing expo.version or expo.android.versionCode');
  }

  if (currentVersion !== gradleVersions.versionName || currentCode !== gradleVersions.versionCode) {
    throw new Error(
      [
        'Version mismatch between app.json and android/app/build.gradle.',
        `  app.json:  ${currentVersion} (code ${currentCode})`,
        `  build.gradle: ${gradleVersions.versionName} (code ${gradleVersions.versionCode})`,
        'Fix the drift, then run bump again.',
      ].join('\n')
    );
  }

  const nextVersion = codeOnly ? currentVersion : bumpSemver(currentVersion, kind);
  const nextCode = currentCode + 1;

  appJson.expo.version = nextVersion;
  appJson.expo.android.versionCode = nextCode;

  fs.writeFileSync(APP_JSON_PATH, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    BUILD_GRADLE_PATH,
    writeGradleVersions(gradleText, nextCode, nextVersion),
    'utf8'
  );

  const label = codeOnly ? 'code-only' : kind;
  console.log(`Bumped (${label}): ${currentVersion} (${currentCode}) → ${nextVersion} (${nextCode})`);
  console.log('Updated: app.json, android/app/build.gradle');
}

try {
  main();
} catch (error) {
  console.error(`bump-version failed: ${error.message}`);
  process.exit(1);
}
