import { sql } from "../lib/db/index.ts";
import type { Handler } from "../lib/types.ts";
import { sendResponse } from "../lib/utils/sendResponse.ts";

export const rootDbHandler: Handler = async (req, res) => {
  const minScore = req.searchParams?.['minScore'];

  let minScoreQuery = ''

  if (minScore) {
    minScoreQuery = 'score > $1';
  }

  // TODO: Define a normal way to define query generator based on possible query parameters
  const customers = await sql(
    `SELECT first_name, country, score FROM customers ${minScoreQuery ? ` WHERE ${minScoreQuery}` : ''} ORDER BY id ASC;`,
    [minScore]
  );

  sendResponse(res, 200, {
    customers: customers.rows,
  });
};
