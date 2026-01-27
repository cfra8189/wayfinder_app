"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.sessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.text)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.integer)("expire").notNull(),
}, (table) => ({
    expireIdx: (0, pg_core_1.index)("IDX_session_expire").on(table.expire)
}));
// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    email: (0, pg_core_1.text)("email").unique(),
    passwordHash: (0, pg_core_1.text)("password_hash"),
    displayName: (0, pg_core_1.text)("display_name"),
    firstName: (0, pg_core_1.text)("first_name"),
    lastName: (0, pg_core_1.text)("last_name"),
    profileImageUrl: (0, pg_core_1.text)("profile_image_url"),
    role: (0, pg_core_1.text)("role").default("artist"),
    businessName: (0, pg_core_1.text)("business_name"),
    businessBio: (0, pg_core_1.text)("business_bio"),
    boxCode: (0, pg_core_1.text)("box_code").unique(),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    verificationToken: (0, pg_core_1.text)("verification_token"),
    verificationTokenExpires: (0, pg_core_1.timestamp)("verification_token_expires", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});
