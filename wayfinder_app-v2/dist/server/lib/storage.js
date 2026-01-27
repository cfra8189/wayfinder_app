"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerObjectStorageRoutes = registerObjectStorageRoutes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("./auth");
const UPLOADS_DIR = path_1.default.join(process.cwd(), "uploads");
// Ensure uploads directory exists
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
function registerObjectStorageRoutes(app) {
    // 1. Request Upload URL
    // This endpoint mimics the Replit Object Storage behavior by returning a URL that the client uses to upload the file.
    app.post("/api/uploads/request-url", auth_1.isAuthenticated, (req, res) => {
        const { name, size, contentType } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Missing required field: name" });
        }
        // Generate a unique filename to avoid collisions
        const ext = path_1.default.extname(name);
        const basename = path_1.default.basename(name, ext).replace(/[^a-zA-Z0-9]/g, "_"); // sanitize
        const uniqueName = `${basename}-${crypto_1.default.randomBytes(8).toString("hex")}${ext}`;
        // The upload URL points to our PUT endpoint
        // Use req.get("host") to construct the full URL
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const uploadURL = `${protocol}://${req.get("host")}/api/uploads/put/${uniqueName}`;
        // The object path is used for retrieval
        const objectPath = uniqueName;
        res.json({
            uploadURL,
            objectPath,
            metadata: { name, size, contentType }
        });
    });
    // 2. Handle the file upload via PUT
    // This endpoint receives the raw file stream from the client.
    app.put("/api/uploads/put/:filename", async (req, res) => {
        const filename = req.params.filename;
        const filepath = path_1.default.join(UPLOADS_DIR, filename);
        // Basic security check: ensure filename doesn't contain path traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return res.status(400).json({ error: "Invalid filename" });
        }
        const writeStream = fs_1.default.createWriteStream(filepath);
        req.pipe(writeStream);
        writeStream.on("finish", () => {
            res.json({ success: true });
        });
        writeStream.on("error", (err) => {
            console.error("Upload error:", err);
            res.status(500).json({ error: "Upload failed" });
        });
    });
    // 3. Serve uploaded files (GET)
    // Maps to /objects/:filename
    app.get("/objects/:filename(*)", (req, res) => {
        const filename = req.params.filename;
        // Basic security check
        if (filename.includes("..")) {
            return res.status(400).json({ error: "Invalid filename" });
        }
        const filepath = path_1.default.join(UPLOADS_DIR, filename);
        if (fs_1.default.existsSync(filepath)) {
            res.sendFile(filepath);
        }
        else {
            res.status(404).json({ error: "File not found" });
        }
    });
}
