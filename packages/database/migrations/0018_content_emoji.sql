ALTER TABLE content_posts ADD COLUMN emoji text NOT NULL DEFAULT '✨' CHECK(emoji IN ('✨','☕','🍷','🍕','🔥','⚡','🎧','🎮','💡','🪴','🐾','🌌'));
