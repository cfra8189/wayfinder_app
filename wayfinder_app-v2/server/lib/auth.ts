
import session from "express-session";
import passport from "passport";
import { type RequestHandler, type Express } from "express";
// @ts-ignore
import SqliteStoreFactory from "better-sqlite3-session-store";
import Database from "better-sqlite3";

// Fix for missing types
declare module "express-session" {
    interface SessionData {
        passport: { user: any };
    }
}

// @ts-ignore
declare module "better-sqlite3-session-store";

// Use a local SQLite database for sessions
const db = new Database("sqlite.db");
const SqliteStore = SqliteStoreFactory(session);

export function setupAuth(app: Express) {
    const sessionSecret = process.env.SESSION_SECRET || "dev_secret_local";
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

    const sessionStore = new SqliteStore({
        client: db,
        expired: {
            clear: true,
            intervalMs: 900000 // 15min
        },
        table: "sessions",
    });

    app.use(
        session({
            secret: sessionSecret,
            store: sessionStore,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                // Secure needs HTTPS, which local dev usually isn't. Set to false for local.
                secure: process.env.NODE_ENV === "production",
                maxAge: sessionTtl,
            },
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
        done(null, user);
    });
}

// Simplified isAuthenticated for local strategy
export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    // Also check manual session setting from local login flow in index.ts
    // The local login sets req.session.passport = { user: { claims: ... } }
    // So req.isAuthenticated() (which checks req.session.passport.user) should implicitly work
    // IF passport.deserializeUser is set up correctly.

    // However, the local login route implementation in index.ts sets:
    // req.session.passport = { user: { claims: { sub: user.id }, ... } }
    // So standard passport.isAuthenticated() might work if we have initialized passport.

    // Fallback explicit check if passport.isAuthenticated() returns false but data is there
    if (req.session && req.session.passport && req.session.passport.user) {
        return next();
    }

    res.status(401).json({ message: "Unauthorized" });
};

// We don't need registerAuthRoutes for Replit strategies anymore.
// The local auth routes are already defined in server/index.ts.
export function registerAuthRoutes(app: Express) {
    // No-op or moving local routes here if desired.
    // For now, keeping them in index.ts as they are.
}
