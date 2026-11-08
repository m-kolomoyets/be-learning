import fs from "node:fs";
import path from "node:path";
import type { Handler } from "../lib/types.ts";
import { sendResponse } from "../lib/utils/sendResponse.ts";
import { pipeline } from "node:stream";
import { ASSETS_ROOT_PATH } from "../lib/constants.ts";



export const downloadFileHandler: Handler = (req, res) => {
  const filename = 'hello.txt';
  const stream = fs.createReadStream(path.join(ASSETS_ROOT_PATH, "hello.txt"));

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
      console.error("Stream error:", error);

      if (!res.headersSent) {
        sendResponse(res, 500, {
          message: "Internal Server Error",
        });
      }
    } else {
      console.log("File download finished");
    }
  });
};
