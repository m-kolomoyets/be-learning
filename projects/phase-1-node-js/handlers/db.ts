import { sql } from "../lib/db/index.ts";
import type { Handler } from "../lib/types.ts";
import { and, select } from "../lib/utils/queryGenerator.ts";
import { sendResponse } from "../lib/utils/sendResponse.ts";

export const rootDbHandler: Handler = async (req, res) => {
  const minScore = req.searchParams?.["minScore"];
  const maxScore = req.searchParams?.["maxScore"];
  const country = req.searchParams?.["country"];

  const conditions: [string, string][] = [];
  const parameters: (string | number)[] = [];

  if (minScore) {
    conditions.push(["score", ">"]);
    parameters.push(minScore);
  }

  if (maxScore) {
    conditions.push(["score", "<="]);
    parameters.push(maxScore);
  }

  if (country) {
    conditions.push(["country", "ILIKE"]);
    parameters.push(country);
  }

  const query = select({
    columns: ["first_name", "country", "score"],
    from: "customers",
    where: and(conditions),
    orderBy: ["id", "ASC"],
  });

  console.log({query})

  const customers = await sql(query, parameters);

  sendResponse(res, 200, {
    customers: customers.rows,
  });
};
