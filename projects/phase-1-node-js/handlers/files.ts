import type { Handler } from '../lib/types.ts';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { ASSETS_ROOT_PATH, MEGABYTE } from '../lib/constants.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';

const FILE_UPLOAD_MAX_SIZE = 5 * MEGABYTE;
const UPLOAD_FILES_DIR_PATH = path.join(ASSETS_ROOT_PATH, 'uploads');

if (!fs.existsSync(UPLOAD_FILES_DIR_PATH)) {
    fs.mkdirSync(UPLOAD_FILES_DIR_PATH);
}

export const downloadFileHandler: Handler = (req, res) => {
    const filename = 'hello.txt';

    const stream = fs.createReadStream(path.join(ASSETS_ROOT_PATH, filename));

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // stream.on("data", (chunk) => {
    //   const canContinue = res.write(chunk);

    //   if (!canContinue) {
    //     stream.pause();

    //     res.once("drain", () => {
    //       stream.resume();
    //     });
    //   }
    // });

    // stream.on("end", () => {
    // sendResponse(res, 200, {
    //   message: "File download finished",
    // });
    // });

    // stream.on("error", (error) => {
    // console.error("Stream error:", error);

    // if (!res.headersSent) {
    //   sendResponse(res, 500, {
    //     message: "Internal Server Error",
    //   });
    // }
    // });

    // req.on('close', () => {
    //   stream.destroy();
    // })

    pipeline(stream, res, (error) => {
        if (error) {
            console.error('Stream error:', error);

            if (!res.headersSent) {
                sendResponse(res, 500, {
                    message: 'Internal Server Error',
                });
            }
        } else {
            console.log('File download finished');
        }
    });
};

export const uploadFileHandler: Handler = (req, res) => {
    const filename = `upload_${Date.now()}.txt`;
    const targetPath = path.join(UPLOAD_FILES_DIR_PATH, filename);

    const writeStream = fs.createWriteStream(targetPath);

    console.log(req.headers);

    let totalBytes = 0;
    let isLimitExceeded = false;

    req.on('data', (chunk) => {
        totalBytes += chunk.length;

        if (totalBytes >= FILE_UPLOAD_MAX_SIZE) {
            req.unpipe(writeStream);
            req.destroy();

            writeStream.destroy();

            fs.unlink(targetPath, (error) => {
                if (error) {
                    console.log('Failed to delete partial file', error);
                }
            });

            if (!res.headersSent) {
                sendResponse(res, 413, {
                    message: 'Payload Too Large: Maximum limit of 5MB exceeded',
                });
            }
        }
    });

    req.on('error', (error) => {
        if (!isLimitExceeded) {
            writeStream.destroy();
            sendResponse(res, 500, {
                message: 'Internal server error',
            });
        }
    });

    writeStream.on('error', (error) => {
        req.destroy();

        if (!res.headersSent) {
            sendResponse(res, 500, {
                message: 'Internal server write error',
            });
        }
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
        if (!isLimitExceeded && !res.headersSent) {
            sendResponse(res, 200, {
                message: 'File was uploaded uccessfully',
            });
        }
    });
};
