import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  image: text("image"),
  domain: text("domain"),
  isRead: boolean("is_read").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});
