export type DeleteInput = {
    userId: number;
    itemName: string;
};

export async function deleteItem(
    db: D1Database,
    input: DeleteInput,
): Promise<string> {
    try {
        await db.prepare(`
            DELETE FROM repop_items
            WHERE discord_user_id = ?1 AND item_name = ?2
        `).bind(input.userId, input.itemName).run();
    } catch (e) {
        if (e instanceof Error) {
            return e.message;
        }
        return JSON.stringify(e);
    }
    return `deleted: ${input.itemName}`;
}