-- Migration number: 0002 	 2023-12-31T07:24:11.728Z
DROP TABLE IF EXISTS repop_items;


CREATE TABLE IF NOT EXISTS repop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    discord_user_id INTEGER NOT NULL,
    start_timestamp TEXT NOT NULL,
    end_timestamp TEXT NOT NULL,
    UNIQUE(item_name, discord_user_id)
);
