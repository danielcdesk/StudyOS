import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const androidRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(androidRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const releases = join(androidRoot, '..', 'builds', 'Android');
const destination = join(releases, 'StudyOS-Android.apk');

mkdirSync(releases, { recursive: true });
copyFileSync(source, destination);
console.log(`APK atualizado em: ${destination}`);
