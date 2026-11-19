import { existsSync, realpathSync, readFileSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function piPackageDir() {
  if (process.env.PI_PACKAGE_DIR) return process.env.PI_PACKAGE_DIR;
  for (const entry of (process.env.PATH || '').split(delimiter)) {
    const bin = join(entry, process.platform === 'win32' ? 'pi.cmd' : 'pi');
    if (!existsSync(bin)) continue;
    let dir = dirname(realpathSync(bin));
    while (dirname(dir) !== dir) {
      const file = join(dir, 'package.json');
      if (existsSync(file)) {
        const name = JSON.parse(readFileSync(file, 'utf8')).name;
        if (name === '@earendil-works/pi-coding-agent') return dir;
      }
      dir = dirname(dir);
    }
  }
  throw new Error('Install Pi first, or set PI_PACKAGE_DIR to its package directory');
}
export async function importPi() { return import(pathToFileURL(join(piPackageDir(), 'dist/index.js')).href); }
