import path from "node:path";
import fs from "node:fs";

export const PRACTICE_FILES_DIR_PATH = path.join(
  process.cwd(),
  "practice",
  "assets",
);

if (!fs.existsSync(PRACTICE_FILES_DIR_PATH)) {
  fs.mkdirSync(PRACTICE_FILES_DIR_PATH, { recursive: true });
}
