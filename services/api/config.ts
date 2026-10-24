import { z } from "zod";
export const configSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  ADMIN_TOKEN: z
    .string()
    .min(32)
    .max(256)
    .regex(/^[\x21-\x7e]+$/)
    .refine((v) => !v.startsWith("replace-"), "Generate a random ADMIN_TOKEN"),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  DATA_DIR: z.string().default("./data"),
  MEDIA_ALLOWED_HOSTS: z.string().default(""),
  MEDIA_LAN_HOSTS: z.string().default(""),
  FOOTBALL_DATA_API_KEY: z.string().default(""),
  API_FOOTBALL_KEY: z.string().default(""),
  FOOTBALL_DATA_DAILY_LIMIT: z.coerce.number().int().positive().default(100),
  API_FOOTBALL_DAILY_LIMIT: z.coerce.number().int().positive().default(100),
  QUOTA_RESERVE_PERCENT: z.coerce.number().min(5).max(50).default(15)
});
export type Config = z.infer<typeof configSchema>;
export function config(env = process.env) {
  return configSchema.parse(env);
}
