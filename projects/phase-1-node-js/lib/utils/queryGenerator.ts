type SelectConfig = {
    columns: string[];
    from: string;
    where?: string;
    orderBy?: [string, string];
};

/**
 * [column, operator]
 */
type ConditionStatement = [string, string];

const conditions = (statements: ConditionStatement[]) => {
    return statements.map((statement, index) => {
        return statement.join(' ') + ` $${index + 1}`;
    });
};

export const and = (statements: ConditionStatement[]) => {
    return conditions(statements).join(' AND ');
};

export const or = (statements: ConditionStatement[]) => {
    return conditions(statements).join(' OR ');
};

export const select = (config: SelectConfig) => {
    const whereClause = config?.where ? `WHERE ${config.where}` : '';
    const orderByClause = config?.orderBy ? `ORDER BY ${config.orderBy[0]} ${config.orderBy[1]}` : '';

    return `SELECT ${config.columns.join(', ')} FROM ${config.from} ${whereClause} ${orderByClause};`.trim();
};
