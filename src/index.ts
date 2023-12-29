import { Hono } from "hono";
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import dayjs from "dayjs";

type Bindings = {
  APPLICATION_ID: string;
  PUBLIC_KEY: string;
  TOKEN: string;
  DB: D1Database;
};
const app = new Hono<{ Bindings: Bindings }>();

type RepopInfo = {
  itemName: string;
  startTimeStamp: string;
  endTimeStamp: string;
};

app.post("/", async (c) => {
  const signature = c.req.header("X-Signature-Ed25519") ?? "";
  const timestamp = c.req.header("X-Signature-Timestamp") ?? "";
  const raw = await c.req.raw.clone().text();
  const isValid = verifyKey(raw, signature, timestamp, c.env.PUBLIC_KEY);
  if (!isValid) {
    return c.json({ message: "invalid request" }, 401);
  }
  const body = await c.req.json();
  if (body.type === InteractionType.PING) {
    return c.json({ type: 1 }, 200);
  }
  if (body.type === InteractionType.APPLICATION_COMMAND) {
    switch (body.data.name) {
      case "test": {
        return c.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "hello world" },
        });
      }
      case "register": {
        const durationRaw = body.data.options[1].value;
        const duration = parseInt(durationRaw.match(/\d+/)[0]);
        const durationUnit = durationRaw.replace(/\d+/g, "");
        const repopInfo: RepopInfo = {
          itemName: body.data.options[0].value,
          startTimeStamp: dayjs().toISOString(),
          endTimeStamp: dayjs().add(duration, durationUnit).toISOString(),
        };

        try {
          const res = await c.env.DB.prepare(
            "INSERT INTO repop_itesm (item_name, start_timestamp, end_timestamp) VALUES (?1, ?2, ?3)",
          )
            .bind(
              repopInfo.itemName,
              repopInfo.startTimeStamp,
              repopInfo.endTimeStamp,
            )
            .run();
          console.log(res);
        } catch (e) {
          if (e instanceof Error) {
            return c.json({ content: e.message });
          }
          const err = JSON.stringify(e);
          return c.json({ content: err });
        }
        return c.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `registerd: ${JSON.stringify(repopInfo)}` },
        });
      }
    }
  }
});

export default app;
