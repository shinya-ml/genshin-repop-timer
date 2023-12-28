import { Hono } from 'hono'
import {InteractionType, InteractionResponseType, verifyKey} from 'discord-interactions'

type Bindings = {
    APPLICATION_ID: string
    PUBLIC_KEY:string
    TOKEN: string
}
const app = new Hono<{Bindings: Bindings}>()

app.post('/', async (c) => {
    const signature = c.req.header('X-Signature-Ed25519') ?? ''
    const timestamp = c.req.header('X-Signature-Timestamp') ?? ''
    const raw = await c.req.raw.clone().text()
    const isValid = verifyKey(raw, signature, timestamp, c.env.PUBLIC_KEY)
    if (!isValid) {
        return c.json({message: 'invalid request'}, 401)
    }
    const body = await c.req.json()
    if (body.type === InteractionType.PING) {
        return c.json({type: 1}, 200)
    }
    return c.json({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: 'hello world'}})
})

export default app
