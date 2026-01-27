"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("./lib/auth");
const storage_1 = require("./lib/storage");
const db_1 = require("./db");
const schema_1 = require("../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const email_1 = require("./lib/email");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Helper route for development
app.get("/", (req, res, next) => {
    // Check if request accepts html
    if (req.accepts("html")) {
        res.send(`
      <html>
        <head><title>Wayfinder API Server</title></head>
        <body style="font-family: system-ui; padding: 2rem; background: #111; color: #eee;">
          <h1>Wayfinder API Server</h1>
          <p>The API server is running on port 3000.</p>
          <p>To access the application during development, visit <a href="http://localhost:5000" style="color: #4ade80">http://localhost:5000</a> (Vite Dev Server).</p>
        </body>
      </html>
    `);
    }
    else {
        next();
    }
});
function renderVerificationPage(success, message) {
    const color = success ? "#c3f53c" : "#ef4444";
    const icon = success ? "✓" : "✗";
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - The Box</title>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { font-family: 'JetBrains Mono', monospace; }
        body { background: #0a0a0a; color: #fff; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; max-width: 400px; padding: 40px; }
        .icon { width: 80px; height: 80px; border-radius: 50%; background: ${color}; color: #000; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        h1 { color: ${color}; margin-bottom: 10px; }
        p { color: #999; margin-bottom: 30px; }
        a { display: inline-block; background: ${color}; color: #000; font-weight: bold; padding: 15px 40px; text-decoration: none; border-radius: 8px; }
        a:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${success ? "Success!" : "Error"}</h1>
        <p>${message}</p>
        <a href="/">Go to The Box</a>
      </div>
    </body>
    </html>
  `;
}
async function main() {
    await (0, auth_1.setupAuth)(app);
    (0, auth_1.registerAuthRoutes)(app);
    (0, storage_1.registerObjectStorageRoutes)(app);
    // Password Change Endpoint
    app.post("/api/auth/change-password", auth_1.isAuthenticated, async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.claims.sub;
            if (!userId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current and new password are required" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (!user.passwordHash) {
                return res.status(400).json({ message: "Account uses OAuth login - password cannot be changed" });
            }
            const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
            await db_1.db.update(schema_1.users).set({ passwordHash: newPasswordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            res.json({ success: true, message: "Password changed successfully" });
        }
        catch (error) {
            console.error("Password change error:", error);
            res.status(500).json({ message: "Failed to change password" });
        }
    });
    // Update Profile (Display Name)
    app.post("/api/auth/update-profile", auth_1.isAuthenticated, async (req, res) => {
        try {
            const { displayName } = req.body;
            const userId = req.user.claims.sub;
            if (!userId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            await db_1.db.update(schema_1.users)
                .set({
                displayName: displayName || null,
                firstName: displayName || null,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            res.json({ success: true, message: "Profile updated successfully" });
        }
        catch (error) {
            console.error("Profile update error:", error);
            res.status(500).json({ message: "Failed to update profile" });
        }
    });
    // Helper function to generate unique BOX code
    async function generateUniqueBoxCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let attempts = 0;
        while (attempts < 10) {
            let code = "BOX-";
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const [existing] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.boxCode, code));
            if (!existing) {
                return code;
            }
            attempts++;
        }
        return "BOX-" + crypto_1.default.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    }
    // Email/Password Registration
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { email, password, displayName, firstName, lastName, role, businessName, studioCode } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            if (!displayName) {
                return res.status(400).json({ message: "Name is required" });
            }
            if (role === "studio" && !businessName) {
                return res.status(400).json({ message: "Business name is required for studios" });
            }
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }
            const [existingUser] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
            if (existingUser) {
                return res.status(400).json({ message: "Email already registered" });
            }
            let studioToJoin = null;
            if (studioCode && role === "artist") {
                const [studio] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.boxCode, studioCode.toUpperCase()));
                if (!studio || studio.role !== "studio") {
                    return res.status(400).json({ message: "Invalid studio code" });
                }
                studioToJoin = studio;
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const boxCode = await generateUniqueBoxCode();
            const [user] = await db_1.db.insert(schema_1.users).values({
                email,
                passwordHash,
                displayName,
                firstName: firstName || null,
                lastName: lastName || null,
                role: role || "artist",
                businessName: role === "studio" ? businessName : null,
                boxCode,
                emailVerified: false,
                verificationToken,
                verificationTokenExpires,
            }).returning();
            if (studioToJoin && user) {
                await db_1.db.insert(schema_1.studioArtists).values({
                    studioId: studioToJoin.id,
                    artistId: user.id,
                    inviteEmail: email,
                    status: "accepted",
                    acceptedAt: new Date(),
                });
            }
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            await (0, email_1.sendVerificationEmail)(email, verificationToken, baseUrl);
            res.json({
                success: true,
                needsVerification: true,
                message: studioToJoin
                    ? `Account created and joined ${studioToJoin.businessName || studioToJoin.displayName}'s network. Please check your email to verify.`
                    : "Please check your email to verify your account"
            });
        }
        catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Registration failed" });
        }
    });
    // Email verification endpoint
    app.get("/api/auth/verify", async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).send(renderVerificationPage(false, "Invalid verification link"));
            }
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.verificationToken, token));
            if (!user) {
                return res.status(400).send(renderVerificationPage(false, "Invalid or expired verification link"));
            }
            if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
                return res.status(400).send(renderVerificationPage(false, "Verification link has expired"));
            }
            await db_1.db.update(schema_1.users)
                .set({
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
            res.send(renderVerificationPage(true, "Your email has been verified!"));
        }
        catch (error) {
            console.error("Verification error:", error);
            res.status(500).send(renderVerificationPage(false, "Verification failed"));
        }
    });
    // Resend verification email
    app.post("/api/auth/resend-verification", async (req, res) => {
        try {
            const { email } = req.body;
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
            if (!user) {
                return res.json({ success: true });
            }
            if (user.emailVerified === true) {
                return res.json({ success: true, message: "Email already verified" });
            }
            const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db_1.db.update(schema_1.users)
                .set({ verificationToken, verificationTokenExpires })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            await (0, email_1.sendVerificationEmail)(email, verificationToken, baseUrl);
            res.json({ success: true, message: "Verification email sent" });
        }
        catch (error) {
            console.error("Resend verification error:", error);
            res.status(500).json({ message: "Failed to resend verification email" });
        }
    });
    // Email/Password Login
    app.post("/api/auth/login", async (req, res) => {
        try {
            console.log("Login attempt for:", req.body.email);
            const { email, password } = req.body;
            if (!email || !password) {
                console.log("Missing email or password");
                return res.status(400).json({ message: "Email and password are required" });
            }
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
            console.log("User found:", !!user, "emailVerified:", user?.emailVerified);
            if (!user || !user.passwordHash) {
                console.log("User not found or no password");
                return res.status(401).json({ message: "Invalid email or password" });
            }
            const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isValid) {
                console.log("Invalid password");
                return res.status(401).json({ message: "Invalid email or password" });
            }
            if (user.emailVerified !== true) {
                console.log("Email not verified");
                return res.status(403).json({
                    message: "Please verify your email before logging in",
                    needsVerification: true,
                    email: user.email
                });
            }
            // Set session with expires_at for compatibility with auth middleware
            const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week from now
            req.session.passport = {
                user: {
                    claims: { sub: user.id },
                    expires_at: expiresAt,
                }
            };
            console.log("Login successful for:", email, "session set");
            res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
        }
        catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "Login failed" });
        }
    });
    app.get("/api/projects", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const userProjects = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.projects.createdAt));
            res.json({ projects: userProjects });
        }
        catch (error) {
            console.error("Failed to fetch projects:", error);
            res.status(500).json({ message: "Failed to fetch projects" });
        }
    });
    app.post("/api/projects", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { title, type, status, description, metadata } = req.body;
            const [project] = await db_1.db.insert(schema_1.projects).values({
                userId,
                title,
                type: type || "single",
                status: status || "concept",
                description,
                metadata: metadata || {},
            }).returning();
            res.json({ project });
        }
        catch (error) {
            console.error("Failed to create project:", error);
            res.status(500).json({ message: "Failed to create project" });
        }
    });
    app.get("/api/projects/:id", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [project] = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(req.params.id)));
            if (!project || project.userId !== userId) {
                return res.status(404).json({ message: "Project not found" });
            }
            res.json({ project });
        }
        catch (error) {
            console.error("Failed to fetch project:", error);
            res.status(500).json({ message: "Failed to fetch project" });
        }
    });
    app.put("/api/projects/:id", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [existing] = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(req.params.id)));
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ message: "Project not found" });
            }
            const { title, type, status, description, metadata } = req.body;
            const [project] = await db_1.db.update(schema_1.projects)
                .set({
                title: title || existing.title,
                type: type || existing.type,
                status: status || existing.status,
                description: description !== undefined ? description : existing.description,
                metadata: metadata || existing.metadata,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(req.params.id)))
                .returning();
            res.json({ project });
        }
        catch (error) {
            console.error("Failed to update project:", error);
            res.status(500).json({ message: "Failed to update project" });
        }
    });
    app.delete("/api/projects/:id", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [existing] = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(req.params.id)));
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ message: "Project not found" });
            }
            await db_1.db.delete(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(req.params.id)));
            res.json({ success: true });
        }
        catch (error) {
            console.error("Failed to delete project:", error);
            res.status(500).json({ message: "Failed to delete project" });
        }
    });
    app.get("/api/creative/notes", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const notes = await db_1.db.select().from(schema_1.creativeNotes)
                .where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.userId, userId))
                .orderBy(schema_1.creativeNotes.sortOrder, schema_1.creativeNotes.createdAt);
            res.json({
                notes: notes.map(n => ({
                    ...n,
                    is_pinned: Boolean(n.isPinned),
                    tags: n.tags || [],
                    sort_order: n.sortOrder ?? 0,
                    media_url: Array.isArray(n.mediaUrls) && n.mediaUrls.length > 0 ? n.mediaUrls[0] : null
                }))
            });
        }
        catch (error) {
            console.error("Failed to fetch notes:", error);
            res.status(500).json({ message: "Failed to fetch notes" });
        }
    });
    app.post("/api/creative/notes", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { category, content, media_url, tags } = req.body;
            // Get max sortOrder for this user's notes and add 1
            const maxResult = await db_1.db.select({ max: (0, drizzle_orm_1.sql) `COALESCE(MAX(${schema_1.creativeNotes.sortOrder}), -1)` })
                .from(schema_1.creativeNotes)
                .where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.userId, userId));
            const nextSortOrder = (maxResult[0]?.max ?? -1) + 1;
            const [note] = await db_1.db.insert(schema_1.creativeNotes).values({
                userId,
                category: category || "ideas",
                content,
                mediaUrls: media_url ? [media_url] : [],
                tags: tags || [],
                sortOrder: nextSortOrder,
            }).returning();
            res.json({ note: { ...note, is_pinned: false, tags: note.tags || [], media_url: media_url || null, sort_order: note.sortOrder } });
        }
        catch (error) {
            console.error("Failed to create note:", error);
            res.status(500).json({ message: "Failed to create note" });
        }
    });
    app.put("/api/creative/notes/:id", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [existing] = await db_1.db.select().from(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)));
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ message: "Note not found" });
            }
            const { category, content, media_url, tags } = req.body;
            const existingUrls = Array.isArray(existing.mediaUrls) ? existing.mediaUrls : [];
            const [note] = await db_1.db.update(schema_1.creativeNotes)
                .set({
                category: category || existing.category,
                content: content || existing.content,
                mediaUrls: media_url !== undefined ? (media_url ? [media_url] : []) : existingUrls,
                tags: tags || existing.tags,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)))
                .returning();
            const returnUrl = Array.isArray(note.mediaUrls) && note.mediaUrls.length > 0 ? note.mediaUrls[0] : null;
            res.json({ note: { ...note, is_pinned: Boolean(note.isPinned), tags: note.tags || [], media_url: returnUrl } });
        }
        catch (error) {
            console.error("Failed to update note:", error);
            res.status(500).json({ message: "Failed to update note" });
        }
    });
    app.delete("/api/creative/notes/:id", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [existing] = await db_1.db.select().from(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)));
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ message: "Note not found" });
            }
            await db_1.db.delete(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)));
            res.json({ success: true });
        }
        catch (error) {
            console.error("Failed to delete note:", error);
            res.status(500).json({ message: "Failed to delete note" });
        }
    });
    app.post("/api/creative/notes/:id/pin", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [existing] = await db_1.db.select().from(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)));
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ message: "Note not found" });
            }
            const [note] = await db_1.db.update(schema_1.creativeNotes)
                .set({ isPinned: !existing.isPinned })
                .where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, parseInt(req.params.id)))
                .returning();
            res.json({ note: { ...note, is_pinned: Boolean(note.isPinned) } });
        }
        catch (error) {
            console.error("Failed to toggle pin:", error);
            res.status(500).json({ message: "Failed to toggle pin" });
        }
    });
    // Reorder notes (drag and drop)
    app.post("/api/creative/notes/reorder", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { noteIds } = req.body;
            if (!Array.isArray(noteIds)) {
                return res.status(400).json({ message: "noteIds must be an array" });
            }
            // Verify all notes belong to the authenticated user
            const userNotes = await db_1.db.select({ id: schema_1.creativeNotes.id }).from(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.userId, userId));
            const userNoteIds = new Set(userNotes.map(n => n.id));
            for (const id of noteIds) {
                if (!userNoteIds.has(id)) {
                    return res.status(403).json({ message: "Unauthorized: Note does not belong to user" });
                }
            }
            // Update sort order for each note owned by the user
            const updates = noteIds.map((id, index) => db_1.db.update(schema_1.creativeNotes)
                .set({ sortOrder: index })
                .where((0, drizzle_orm_1.sql) `${schema_1.creativeNotes.id} = ${id} AND ${schema_1.creativeNotes.userId} = ${userId}`));
            await Promise.all(updates);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Failed to reorder notes:", error);
            res.status(500).json({ message: "Failed to reorder notes" });
        }
    });
    // Admin routes
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    function isAdmin(req, res, next) {
        if (req.session?.isAdmin) {
            next();
        }
        else {
            res.status(401).json({ message: "Admin access required" });
        }
    }
    app.get("/api/admin/check", (req, res) => {
        if (req.session?.isAdmin) {
            res.json({ isAdmin: true });
        }
        else {
            res.status(401).json({ isAdmin: false });
        }
    });
    app.post("/api/admin/login", (req, res) => {
        const { password } = req.body;
        if (!ADMIN_PASSWORD) {
            return res.status(500).json({ message: "Admin password not configured" });
        }
        if (password === ADMIN_PASSWORD) {
            req.session.isAdmin = true;
            res.json({ success: true });
        }
        else {
            res.status(401).json({ message: "Invalid password" });
        }
    });
    app.post("/api/admin/logout", (req, res) => {
        req.session.isAdmin = false;
        res.json({ success: true });
    });
    app.get("/api/admin/users", isAdmin, async (req, res) => {
        try {
            const allUsers = await db_1.db.select().from(schema_1.users).orderBy((0, drizzle_orm_1.desc)(schema_1.users.createdAt));
            res.json(allUsers);
        }
        catch (error) {
            console.error("Failed to fetch users:", error);
            res.status(500).json({ message: "Failed to fetch users" });
        }
    });
    app.get("/api/admin/projects", isAdmin, async (req, res) => {
        try {
            const allProjects = await db_1.db.select().from(schema_1.projects).orderBy((0, drizzle_orm_1.desc)(schema_1.projects.createdAt));
            res.json(allProjects);
        }
        catch (error) {
            console.error("Failed to fetch projects:", error);
            res.status(500).json({ message: "Failed to fetch projects" });
        }
    });
    app.get("/api/admin/stats", isAdmin, async (req, res) => {
        try {
            const allUsers = await db_1.db.select().from(schema_1.users);
            const allProjects = await db_1.db.select().from(schema_1.projects);
            const projectsByStatus = {};
            allProjects.forEach(p => {
                projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
            });
            res.json({
                totalUsers: allUsers.length,
                totalProjects: allProjects.length,
                projectsByStatus,
            });
        }
        catch (error) {
            console.error("Failed to fetch stats:", error);
            res.status(500).json({ message: "Failed to fetch stats" });
        }
    });
    // Community Sharing Endpoints
    // User submits a note for community sharing
    app.post("/api/community/submit", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { noteId } = req.body;
            // Verify the note belongs to the user
            const [note] = await db_1.db.select().from(schema_1.creativeNotes).where((0, drizzle_orm_1.eq)(schema_1.creativeNotes.id, noteId));
            if (!note || note.userId !== userId) {
                return res.status(404).json({ message: "Note not found" });
            }
            // Check if already submitted
            const [existing] = await db_1.db.select().from(schema_1.sharedContent).where((0, drizzle_orm_1.eq)(schema_1.sharedContent.noteId, noteId));
            if (existing) {
                return res.status(400).json({ message: "Note already submitted for sharing", status: existing.status });
            }
            // Get numeric user ID
            const [userRecord] = await db_1.db.select({ numericId: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);
            const [submission] = await db_1.db.insert(schema_1.sharedContent).values({
                noteId,
                userId: numericUserId,
                status: "pending",
            }).returning();
            res.json({ submission });
        }
        catch (error) {
            console.error("Failed to submit for sharing:", error);
            res.status(500).json({ message: "Failed to submit for sharing" });
        }
    });
    // User gets their submission status
    app.get("/api/community/my-submissions", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [userRecord] = await db_1.db.select({ numericId: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);
            const submissions = await db_1.db.select().from(schema_1.sharedContent).where((0, drizzle_orm_1.eq)(schema_1.sharedContent.userId, numericUserId));
            res.json({ submissions });
        }
        catch (error) {
            console.error("Failed to fetch submissions:", error);
            res.status(500).json({ message: "Failed to fetch submissions" });
        }
    });
    // Admin: Get all pending submissions
    app.get("/api/admin/submissions", isAdmin, async (req, res) => {
        try {
            const submissions = await db_1.db
                .select({
                id: schema_1.sharedContent.id,
                noteId: schema_1.sharedContent.noteId,
                userId: schema_1.sharedContent.userId,
                status: schema_1.sharedContent.status,
                adminNotes: schema_1.sharedContent.adminNotes,
                createdAt: schema_1.sharedContent.createdAt,
                approvedAt: schema_1.sharedContent.approvedAt,
                noteContent: schema_1.creativeNotes.content,
                noteCategory: schema_1.creativeNotes.category,
                noteMediaUrls: schema_1.creativeNotes.mediaUrls,
                noteTags: schema_1.creativeNotes.tags,
            })
                .from(schema_1.sharedContent)
                .leftJoin(schema_1.creativeNotes, (0, drizzle_orm_1.eq)(schema_1.sharedContent.noteId, schema_1.creativeNotes.id))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.sharedContent.createdAt));
            res.json({ submissions });
        }
        catch (error) {
            console.error("Failed to fetch submissions:", error);
            res.status(500).json({ message: "Failed to fetch submissions" });
        }
    });
    // Admin: Approve or reject a submission
    app.post("/api/admin/submissions/:id/review", isAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;
            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
            }
            const [updated] = await db_1.db.update(schema_1.sharedContent)
                .set({
                status,
                adminNotes,
                approvedAt: status === "approved" ? new Date() : null,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.sharedContent.id, parseInt(id)))
                .returning();
            res.json({ submission: updated });
        }
        catch (error) {
            console.error("Failed to review submission:", error);
            res.status(500).json({ message: "Failed to review submission" });
        }
    });
    // Public: Get approved community content
    app.get("/api/community", async (req, res) => {
        try {
            const approved = await db_1.db
                .select({
                id: schema_1.sharedContent.id,
                noteId: schema_1.sharedContent.noteId,
                userId: schema_1.sharedContent.userId,
                approvedAt: schema_1.sharedContent.approvedAt,
                noteContent: schema_1.creativeNotes.content,
                noteCategory: schema_1.creativeNotes.category,
                noteMediaUrls: schema_1.creativeNotes.mediaUrls,
                noteTags: schema_1.creativeNotes.tags,
            })
                .from(schema_1.sharedContent)
                .leftJoin(schema_1.creativeNotes, (0, drizzle_orm_1.eq)(schema_1.sharedContent.noteId, schema_1.creativeNotes.id))
                .where((0, drizzle_orm_1.eq)(schema_1.sharedContent.status, "approved"))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.sharedContent.approvedAt));
            // Get favorites count for each
            const result = await Promise.all(approved.map(async (item) => {
                const favorites = await db_1.db.select().from(schema_1.communityFavorites).where((0, drizzle_orm_1.eq)(schema_1.communityFavorites.sharedContentId, item.id));
                const comments = await db_1.db.select().from(schema_1.communityComments).where((0, drizzle_orm_1.eq)(schema_1.communityComments.sharedContentId, item.id));
                return {
                    ...item,
                    favoritesCount: favorites.length,
                    commentsCount: comments.length,
                };
            }));
            res.json({ content: result });
        }
        catch (error) {
            console.error("Failed to fetch community content:", error);
            res.status(500).json({ message: "Failed to fetch community content" });
        }
    });
    // Toggle favorite on shared content
    app.post("/api/community/:id/favorite", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const sharedContentId = parseInt(req.params.id);
            const [userRecord] = await db_1.db.select({ numericId: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);
            // Check if already favorited
            const [existing] = await db_1.db.select().from(schema_1.communityFavorites)
                .where((0, drizzle_orm_1.sql) `${schema_1.communityFavorites.sharedContentId} = ${sharedContentId} AND ${schema_1.communityFavorites.userId} = ${numericUserId}`);
            if (existing) {
                await db_1.db.delete(schema_1.communityFavorites).where((0, drizzle_orm_1.eq)(schema_1.communityFavorites.id, existing.id));
                res.json({ favorited: false });
            }
            else {
                await db_1.db.insert(schema_1.communityFavorites).values({
                    sharedContentId,
                    userId: numericUserId,
                });
                res.json({ favorited: true });
            }
        }
        catch (error) {
            console.error("Failed to toggle favorite:", error);
            res.status(500).json({ message: "Failed to toggle favorite" });
        }
    });
    // Add comment to shared content
    app.post("/api/community/:id/comment", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const sharedContentId = parseInt(req.params.id);
            const { content } = req.body;
            if (!content?.trim()) {
                return res.status(400).json({ message: "Comment content is required" });
            }
            const [userRecord] = await db_1.db.select({ numericId: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);
            const [comment] = await db_1.db.insert(schema_1.communityComments).values({
                sharedContentId,
                userId: numericUserId,
                content: content.trim(),
            }).returning();
            res.json({ comment });
        }
        catch (error) {
            console.error("Failed to add comment:", error);
            res.status(500).json({ message: "Failed to add comment" });
        }
    });
    // Get comments for shared content
    app.get("/api/community/:id/comments", async (req, res) => {
        try {
            const sharedContentId = parseInt(req.params.id);
            const comments = await db_1.db.select().from(schema_1.communityComments)
                .where((0, drizzle_orm_1.eq)(schema_1.communityComments.sharedContentId, sharedContentId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.communityComments.createdAt));
            res.json({ comments });
        }
        catch (error) {
            console.error("Failed to fetch comments:", error);
            res.status(500).json({ message: "Failed to fetch comments" });
        }
    });
    // Get user's favorites
    app.get("/api/community/my-favorites", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [userRecord] = await db_1.db.select({ numericId: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            const numericUserId = typeof userRecord?.numericId === 'number' ? userRecord.numericId : parseInt(userId);
            const favorites = await db_1.db.select({ sharedContentId: schema_1.communityFavorites.sharedContentId })
                .from(schema_1.communityFavorites)
                .where((0, drizzle_orm_1.eq)(schema_1.communityFavorites.userId, numericUserId));
            res.json({ favoriteIds: favorites.map(f => f.sharedContentId) });
        }
        catch (error) {
            console.error("Failed to fetch favorites:", error);
            res.status(500).json({ message: "Failed to fetch favorites" });
        }
    });
    // Admin: Create blog post from shared content
    app.post("/api/admin/blog", isAdmin, async (req, res) => {
        try {
            const { sharedContentId, title, content } = req.body;
            if (!title || !content) {
                return res.status(400).json({ message: "Title and content are required" });
            }
            const [post] = await db_1.db.insert(schema_1.blogPosts).values({
                sharedContentId: sharedContentId || null,
                title,
                content,
                authorId: 1, // Admin user
            }).returning();
            // Update shared content with blog post reference
            if (sharedContentId) {
                await db_1.db.update(schema_1.sharedContent)
                    .set({ blogPostId: post.id })
                    .where((0, drizzle_orm_1.eq)(schema_1.sharedContent.id, sharedContentId));
            }
            res.json({ post });
        }
        catch (error) {
            console.error("Failed to create blog post:", error);
            res.status(500).json({ message: "Failed to create blog post" });
        }
    });
    // Get all published blog posts
    app.get("/api/blog", async (req, res) => {
        try {
            const posts = await db_1.db.select().from(schema_1.blogPosts)
                .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.isPublished, true))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.blogPosts.publishedAt));
            res.json({ posts });
        }
        catch (error) {
            console.error("Failed to fetch blog posts:", error);
            res.status(500).json({ message: "Failed to fetch blog posts" });
        }
    });
    // Admin: Publish/unpublish blog post
    app.post("/api/admin/blog/:id/publish", isAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const [post] = await db_1.db.select().from(schema_1.blogPosts).where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, parseInt(id)));
            const newStatus = !Boolean(post.isPublished);
            const [updated] = await db_1.db.update(schema_1.blogPosts)
                .set({
                isPublished: newStatus,
                publishedAt: newStatus ? new Date() : null,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, parseInt(id)))
                .returning();
            res.json({ post: updated });
        }
        catch (error) {
            console.error("Failed to toggle publish:", error);
            res.status(500).json({ message: "Failed to toggle publish" });
        }
    });
    // Studio: Get studio's artist roster
    app.get("/api/studio/artists", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            if (user?.role !== "studio") {
                return res.status(403).json({ message: "Studio access only" });
            }
            const relations = await db_1.db.select().from(schema_1.studioArtists).where((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, parseInt(userId)));
            const artistsWithInfo = await Promise.all(relations.map(async (rel) => {
                if (rel.artistId) {
                    const [artist] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, rel.artistId));
                    const artistProjects = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.userId, rel.artistId));
                    return {
                        id: rel.id,
                        artistId: rel.artistId,
                        inviteEmail: rel.inviteEmail,
                        status: rel.status,
                        createdAt: rel.createdAt,
                        acceptedAt: rel.acceptedAt,
                        artistName: artist?.displayName || artist?.email || "Unknown",
                        artistEmail: artist?.email,
                        projectCount: artistProjects.length,
                    };
                }
                return {
                    id: rel.id,
                    artistId: null,
                    inviteEmail: rel.inviteEmail,
                    status: rel.status,
                    createdAt: rel.createdAt,
                    acceptedAt: null,
                    artistName: null,
                    artistEmail: rel.inviteEmail,
                    projectCount: 0,
                };
            }));
            res.json({ artists: artistsWithInfo });
        }
        catch (error) {
            console.error("Failed to fetch artists:", error);
            res.status(500).json({ message: "Failed to fetch artists" });
        }
    });
    // Studio: Invite artist by email
    app.post("/api/studio/invite", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { email } = req.body;
            const userIdNum = parseInt(userId);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (user?.role !== "studio") {
                return res.status(403).json({ message: "Studio access only" });
            }
            const [existingArtist] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
            if (existingArtist) {
                const [existingRelation] = await db_1.db.select().from(schema_1.studioArtists)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, userIdNum), (0, drizzle_orm_1.eq)(schema_1.studioArtists.artistId, existingArtist.id)));
                if (existingRelation) {
                    return res.status(400).json({ message: "Artist already in your roster" });
                }
                await db_1.db.insert(schema_1.studioArtists).values({
                    studioId: userIdNum,
                    artistId: existingArtist.id,
                    status: "pending",
                    inviteEmail: email,
                });
            }
            else {
                const [existingInvite] = await db_1.db.select().from(schema_1.studioArtists)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, userIdNum), (0, drizzle_orm_1.eq)(schema_1.studioArtists.inviteEmail, email)));
                if (existingInvite) {
                    return res.status(400).json({ message: "Invitation already sent" });
                }
                await db_1.db.insert(schema_1.studioArtists).values({
                    studioId: userIdNum,
                    artistId: null,
                    status: "pending",
                    inviteEmail: email,
                });
            }
            res.json({ success: true, message: "Invitation sent" });
        }
        catch (error) {
            console.error("Failed to invite artist:", error);
            res.status(500).json({ message: "Failed to invite artist" });
        }
    });
    // Studio: Get artist's projects
    app.get("/api/studio/artists/:artistId/projects", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { artistId } = req.params;
            const userIdNum = parseInt(userId);
            const artistIdNum = parseInt(artistId);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (user?.role !== "studio") {
                return res.status(403).json({ message: "Studio access only" });
            }
            const [relation] = await db_1.db.select().from(schema_1.studioArtists)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, userIdNum), (0, drizzle_orm_1.eq)(schema_1.studioArtists.artistId, artistIdNum)));
            if (!relation || relation.status !== "accepted") {
                return res.status(403).json({ message: "Artist not in your roster" });
            }
            const artistProjects = await db_1.db.select().from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.userId, artistIdNum))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.projects.updatedAt));
            res.json({ projects: artistProjects });
        }
        catch (error) {
            console.error("Failed to fetch artist projects:", error);
            res.status(500).json({ message: "Failed to fetch artist projects" });
        }
    });
    // Studio: Toggle project featured status
    app.post("/api/studio/projects/:projectId/feature", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { projectId } = req.params;
            const { featured } = req.body;
            const userIdNum = parseInt(userId);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (user?.role !== "studio") {
                return res.status(403).json({ message: "Studio access only" });
            }
            const [project] = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(projectId)));
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            const [relation] = await db_1.db.select().from(schema_1.studioArtists)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, userIdNum), (0, drizzle_orm_1.eq)(schema_1.studioArtists.artistId, project.userId)));
            if (!relation || relation.status !== "accepted") {
                return res.status(403).json({ message: "Artist not in your roster" });
            }
            const [updated] = await db_1.db.update(schema_1.projects)
                .set({ isFeatured: featured })
                .where((0, drizzle_orm_1.eq)(schema_1.projects.id, parseInt(projectId)))
                .returning();
            res.json({ project: updated });
        }
        catch (error) {
            console.error("Failed to toggle featured:", error);
            res.status(500).json({ message: "Failed to toggle featured" });
        }
    });
    // Studio: Remove artist from roster
    app.delete("/api/studio/artists/:relationId", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { relationId } = req.params;
            const userIdNum = parseInt(userId);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (user?.role !== "studio") {
                return res.status(403).json({ message: "Studio access only" });
            }
            await db_1.db.delete(schema_1.studioArtists)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.id, parseInt(relationId)), (0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, userIdNum)));
            res.json({ success: true });
        }
        catch (error) {
            console.error("Failed to remove artist:", error);
            res.status(500).json({ message: "Failed to remove artist" });
        }
    });
    // Public: Get studio portfolio
    app.get("/api/portfolio/:studioId", async (req, res) => {
        try {
            const { studioId } = req.params;
            const studioIdNum = parseInt(studioId);
            const [studio] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, studioIdNum));
            if (!studio || studio.role !== "studio") {
                return res.status(404).json({ message: "Studio not found" });
            }
            const relations = await db_1.db.select().from(schema_1.studioArtists)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.studioId, studioIdNum), (0, drizzle_orm_1.eq)(schema_1.studioArtists.status, "accepted")));
            const roster = await Promise.all(relations.map(async (rel) => {
                if (!rel.artistId)
                    return null;
                const [artist] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, rel.artistId));
                const artistProjects = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.userId, rel.artistId));
                return {
                    id: rel.artistId,
                    displayName: artist?.displayName || "Unknown",
                    projectCount: artistProjects.length,
                };
            }));
            const allFeaturedProjects = [];
            for (const rel of relations) {
                if (!rel.artistId)
                    continue;
                const artistFeatured = await db_1.db.select().from(schema_1.projects)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projects.userId, rel.artistId), (0, drizzle_orm_1.eq)(schema_1.projects.isFeatured, true)));
                const [artist] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, rel.artistId));
                for (const proj of artistFeatured) {
                    allFeaturedProjects.push({
                        ...proj,
                        artistName: artist?.displayName || "Unknown",
                    });
                }
            }
            res.json({
                studio: {
                    id: studio.id,
                    businessName: studio.businessName,
                    businessBio: studio.businessBio,
                    displayName: studio.displayName,
                },
                roster: roster.filter(r => r !== null),
                featuredProjects: allFeaturedProjects,
            });
        }
        catch (error) {
            console.error("Failed to fetch portfolio:", error);
            res.status(500).json({ message: "Failed to fetch portfolio" });
        }
    });
    // Artist: Accept studio invitation
    app.post("/api/studio/invitations/:invitationId/accept", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const { invitationId } = req.params;
            const userIdNum = parseInt(userId);
            const [invitation] = await db_1.db.select().from(schema_1.studioArtists).where((0, drizzle_orm_1.eq)(schema_1.studioArtists.id, parseInt(invitationId)));
            if (!invitation) {
                return res.status(404).json({ message: "Invitation not found" });
            }
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (invitation.inviteEmail !== user?.email) {
                return res.status(403).json({ message: "This invitation is not for you" });
            }
            const [updated] = await db_1.db.update(schema_1.studioArtists)
                .set({
                artistId: userIdNum,
                status: "accepted",
                acceptedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.studioArtists.id, parseInt(invitationId)))
                .returning();
            res.json({ success: true, invitation: updated });
        }
        catch (error) {
            console.error("Failed to accept invitation:", error);
            res.status(500).json({ message: "Failed to accept invitation" });
        }
    });
    // Artist: Get pending invitations
    app.get("/api/artist/invitations", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const userIdNum = parseInt(userId);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userIdNum));
            if (!user?.email) {
                return res.json({ invitations: [] });
            }
            const invitations = await db_1.db.select().from(schema_1.studioArtists)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studioArtists.inviteEmail, user.email), (0, drizzle_orm_1.eq)(schema_1.studioArtists.status, "pending")));
            const invitationsWithStudio = await Promise.all(invitations.map(async (inv) => {
                const [studio] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, inv.studioId));
                return {
                    id: inv.id,
                    studioName: studio?.businessName || studio?.displayName || "Unknown Studio",
                    createdAt: inv.createdAt,
                };
            }));
            res.json({ invitations: invitationsWithStudio });
        }
        catch (error) {
            console.error("Failed to fetch invitations:", error);
            res.status(500).json({ message: "Failed to fetch invitations" });
        }
    });
    // EPK: Get user's press kit
    app.get("/api/epk", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = parseInt(req.user.claims.sub);
            const [epk] = await db_1.db.select().from(schema_1.pressKits).where((0, drizzle_orm_1.eq)(schema_1.pressKits.userId, userId));
            res.json({ epk: epk || null });
        }
        catch (error) {
            console.error("Failed to fetch EPK:", error);
            res.status(500).json({ message: "Failed to fetch EPK" });
        }
    });
    // EPK: Create or update press kit
    app.post("/api/epk", auth_1.isAuthenticated, async (req, res) => {
        try {
            const userId = parseInt(req.user.claims.sub);
            const { shortBio, mediumBio, longBio, genre, location, photoUrls, videoUrls, featuredTracks, achievements, pressQuotes, socialLinks, contactEmail, contactName, bookingEmail, technicalRider, stagePlot, isPublished } = req.body;
            const [existing] = await db_1.db.select().from(schema_1.pressKits).where((0, drizzle_orm_1.eq)(schema_1.pressKits.userId, userId));
            if (existing) {
                const [updated] = await db_1.db.update(schema_1.pressKits)
                    .set({
                    shortBio, mediumBio, longBio, genre, location,
                    photoUrls, videoUrls, featuredTracks, achievements, pressQuotes,
                    socialLinks, contactEmail, contactName, bookingEmail,
                    technicalRider, stagePlot, isPublished,
                    updatedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.pressKits.userId, userId))
                    .returning();
                res.json({ epk: updated });
            }
            else {
                const [created] = await db_1.db.insert(schema_1.pressKits)
                    .values({
                    userId,
                    shortBio, mediumBio, longBio, genre, location,
                    photoUrls, videoUrls, featuredTracks, achievements, pressQuotes,
                    socialLinks, contactEmail, contactName, bookingEmail,
                    technicalRider, stagePlot, isPublished
                })
                    .returning();
                res.json({ epk: created });
            }
        }
        catch (error) {
            console.error("Failed to save EPK:", error);
            res.status(500).json({ message: "Failed to save EPK" });
        }
    });
    // EPK: Public view (by user BOX code)
    app.get("/api/epk/:boxCode", async (req, res) => {
        try {
            const { boxCode } = req.params;
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.boxCode, boxCode.toUpperCase()));
            if (!user) {
                return res.status(404).json({ message: "Artist not found" });
            }
            const [epk] = await db_1.db.select().from(schema_1.pressKits).where((0, drizzle_orm_1.eq)(schema_1.pressKits.userId, user.id));
            if (!epk || !epk.isPublished) {
                return res.status(404).json({ message: "Press kit not found or not published" });
            }
            const userProjects = await db_1.db.select().from(schema_1.projects)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projects.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.projects.status, "published")))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.projects.createdAt))
                .limit(10);
            res.json({
                epk,
                artist: {
                    id: user.id,
                    displayName: user.displayName,
                    profileImageUrl: user.profileImageUrl,
                    boxCode: user.boxCode,
                },
                projects: userProjects
            });
        }
        catch (error) {
            console.error("Failed to fetch public EPK:", error);
            res.status(500).json({ message: "Failed to fetch EPK" });
        }
    });
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}
main().catch(console.error);
