import dotenv from 'dotenv';
import z from 'zod/v4';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    LOG_LEVEL: z.enum(['info', 'warning', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
