/**
 * Database Schema
 * Defines the items table for storing saved links
 */
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),               // Links item to Supabase auth user
  url: text("url").notNull(),                      // Original URL
  title: text("title"),                            // Extracted page title
  description: text("description"),                // Meta description
  image: text("image"),                            // OG/Twitter image URL
  domain: text("domain"),                          // Hostname for favicon
  isRead: boolean("is_read").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),                    // When marked as read
});
