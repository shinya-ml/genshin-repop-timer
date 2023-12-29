-- Migration number: 0000 	 2023-12-29T07:51:53.434Z
CREATE TABLE IF NOT EXISTS repop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    start_timestamp TEXT NOT NULL,
    end_timestamp TEXT NOT NULL
);
