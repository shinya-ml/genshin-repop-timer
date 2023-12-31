-- Migration number: 0001 	 2023-12-31T06:58:40.331Z
ALTER TABLE repop_items ADD COLUMN discord_user_id INTEGER NOT NULL DEFAULT 0; 