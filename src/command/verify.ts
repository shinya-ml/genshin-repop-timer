import dayjs from "dayjs";
import { RepopItem } from "../model/item";

type VerifyInput = {
  userId: number;
  itemName: string;
};

export async function verify(
  db: D1Database,
  input: VerifyInput,
): Promise<string> {
  const userId = input.userId;
  const itemName = input.itemName;
  try {
    const res = await db
      .prepare(
        "SELECT item_name as itemName, start_timestamp as startTimeStamp, end_timestamp as endTimeStamp FROM repop_items WHERE item_name = ?1 and discord_user_id = ?2",
      )
      .bind(itemName, userId)
      .first<RepopItem>();
    if (!res) {
      return "item not registered";
    }

    if (dayjs().isAfter(res.endTimeStamp)) {
      return "item repoped";
    }
    return `${res.itemName} is not repoped yet. it will be repoped at ${res.endTimeStamp}`;
  } catch (e) {
    if (e instanceof Error) {
      return e.message;
    }
    return JSON.stringify(e);
  }
}
