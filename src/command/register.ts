import { Context } from "hono";
import dayjs, { ManipulateType } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export type RegisterInput = {
  registerUserId: number;
  itemName: string;
  duration: string;
};

export async function register(
  c: Context,
  input: RegisterInput,
): Promise<string> {
  const durationNum = parseInt(input.duration.match(/\d+/)?.[0] || "0");
  const durationUnit = input.duration.replace(/\d+/g, "");
  const now = dayjs();
  const endTimeStamp = now.add(durationNum, durationUnit as ManipulateType);

  try {
    await c.env.DB.prepare(
      `INSERT INTO repop_items
			  (discord_user_id, item_name, start_timestamp, end_timestamp)
			  VALUES (?1, ?2, ?3, ?4)
			  ON CONFLICT (discord_user_id, item_name) DO UPDATE SET start_timestamp = excluded.start_timestamp, end_timestamp = excluded.end_timestamp
			  `,
    )
      .bind(
        input.registerUserId,
        input.itemName,
        now.toISOString(),
        endTimeStamp.toISOString(),
      )
      .run();
  } catch (e) {
    if (e instanceof Error) {
      return e.message;
    }
    return JSON.stringify(e);
  }
  return `registerd: ${input.itemName}, it will be repoped at ${endTimeStamp
    .tz("Asia/Tokyo")
    .format()}`;
}
