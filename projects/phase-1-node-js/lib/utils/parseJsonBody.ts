import { MEGABYTE } from "../constants.ts"
import type { JsonObject, Request } from "../types.ts"

export const parseJsonBody = <TBody extends JsonObject>(req: Request, maxBytes = MEGABYTE): Promise<TBody> => {
  return new Promise((resolve, reject) => {
    let receivedBytes = 0;
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;

      if (receivedBytes > maxBytes) {
        req.destroy();
        return reject(new Error('Payload is too large'));
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const stringifiedBody = Buffer.concat(chunks).toString('utf-8');
        const jsonBody = JSON.parse(stringifiedBody) as TBody;
        resolve(jsonBody);
      } catch(err) {
        reject(new Error('Invalid JSON'));
      }
    });
  })
}
