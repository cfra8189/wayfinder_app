"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
exports.setupAuth = setupAuth;
exports.registerAuthRoutes = registerAuthRoutes;
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
// @ts-ignore
const better_sqlite3_session_store_1 = __importDefault(require("better-sqlite3-session-store"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
// Use a local SQLite database for sessions
const db = new better_sqlite3_1.default("sqlite.db");
const SqliteStore = (0, better_sqlite3_session_store_1.default)(express_session_1.default);
function setupAuth(app) {
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
    app.use((0, express_session_1.default)({
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
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
}
// Simplified isAuthenticated for local strategy
const isAuthenticated = (req, res, next) => {
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
exports.isAuthenticated = isAuthenticated;
// We don't need registerAuthRoutes for Replit strategies anymore.
// The local auth routes are already defined in server/index.ts.
function registerAuthRoutes(app) {
    // No-op or moving local routes here if desired.
    // For now, keeping them in index.ts as they are.
}
