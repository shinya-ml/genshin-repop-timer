import { RepopItem } from "../model/item";
import dayjs from "dayjs";

export async function list(
  db: D1Database,
  userId: number,
): Promise<RepopItem[]> {
  const { results } = await db
    .prepare(
      "SELECT item_name as itemName, end_timestamp as endTimeStamp FROM repop_items WHERE discord_user_id = ?1",
    )
    .bind(userId)
    .all<RepopItem>();
  const now = dayjs();
  return results.filter((item) => now.isAfter(item.endTimeStamp));
}
