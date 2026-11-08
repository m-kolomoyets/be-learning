import fs from 'node:fs';
import path from 'node:path';

export const PRACTICE_FILES_DIR_PATH = path.join(process.cwd(), 'practice', 'assets');

if (!fs.existsSync(PRACTICE_FILES_DIR_PATH)) {
    fs.mkdirSync(PRACTICE_FILES_DIR_PATH, { recursive: true });
}
