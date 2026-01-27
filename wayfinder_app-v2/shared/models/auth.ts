import { index, integer, pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire)
  })
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("artist"),
  businessName: text("business_name"),
  businessBio: text("business_bio"),
  boxCode: text("box_code").unique(),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: integer("verification_token_expires"),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

