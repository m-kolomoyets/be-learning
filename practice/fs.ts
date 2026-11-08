import path from "node:path";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { PRACTICE_FILES_DIR_PATH } from "./constants.ts";

type FileResult = {
  style: string;
  fileName: string;
  content: string;
  size: number;
};

const FS_ASSETS_DIR_PATH = path.join(PRACTICE_FILES_DIR_PATH, "fs");

if (!fs.existsSync(FS_ASSETS_DIR_PATH)) {
  fs.mkdirSync(FS_ASSETS_DIR_PATH, { recursive: true });
}

const SYNC_FILE_PATH = path.join(FS_ASSETS_DIR_PATH, "sync.txt");
const CALLBACK_FILE_PATH = path.join(FS_ASSETS_DIR_PATH, "callback.txt");
const PROMISE_FILE_PATH = path.join(FS_ASSETS_DIR_PATH, "promise.txt");

const syncExample = (): FileResult => {
  fs.writeFileSync(
    SYNC_FILE_PATH,
    "File was created with fs.writeFileSync\n",
    "utf-8",
  );
  fs.appendFileSync(
    SYNC_FILE_PATH,
    "Appended content using fs.appendFileSync",
    "utf-8",
  );

  const fileContent = fs.readFileSync(SYNC_FILE_PATH, "utf-8");

  const fileStats = fs.statSync(SYNC_FILE_PATH);

  return {
    style: "sync",
    fileName: path.basename(SYNC_FILE_PATH),
    content: fileContent,
    size: fileStats.size,
  };
};

// Callback Hell OMG)
const callbackExample = async (): Promise<FileResult> => {
  return new Promise((res, rej) => {
    fs.writeFile(
      CALLBACK_FILE_PATH,
      "Created using fs.writeFile Callback\n",
      {
        encoding: "utf-8",
      },
      (writeError) => {
        if (writeError) {
          return rej(writeError);
        }

        fs.appendFile(
          CALLBACK_FILE_PATH,
          "Appended using fs.writeFile Callback",
          {
            encoding: "utf-8",
          },
          (appendError) => {
            if (appendError) {
              return rej(appendError);
            }

            fs.readFile(
              CALLBACK_FILE_PATH,
              {
                encoding: "utf-8",
              },
              (readError, content) => {
                if (readError) {
                  return rej(readError);
                }

                fs.stat(CALLBACK_FILE_PATH, (statError, stats) => {
                  if (statError) {
                    return rej(statError);
                  }

                  res({
                    style: "callback",
                    fileName: path.basename(CALLBACK_FILE_PATH),
                    content,
                    size: stats.size,
                  });
                });
              },
            );
          },
        );
      },
    );
  });
};

const promisesExample = async (): Promise<FileResult> => {
  await fsPromises.writeFile(
    PROMISE_FILE_PATH,
    "Created with fsPromises.writeFile\n",
    {
      encoding: "utf-8",
    },
  );
  await fsPromises.appendFile(
    PROMISE_FILE_PATH,
    "Appended with fsPromises.writeFile\n",
    { encoding: "utf-8" },
  );

  const content = await fsPromises.readFile(PROMISE_FILE_PATH, {
    encoding: "utf-8",
  });
  const stats = await fsPromises.stat(PROMISE_FILE_PATH);

  return {
    style: "promises",
    fileName: path.basename(PROMISE_FILE_PATH),
    content,
    size: stats.size,
  };
};

const main = async () => {
  try {
    const filesExecutions = await Promise.all([
      syncExample(),
      callbackExample(),
      promisesExample(),
    ]);

    console.log(filesExecutions);
  } catch (error) {
    console.error(error);
  }
};

main();
