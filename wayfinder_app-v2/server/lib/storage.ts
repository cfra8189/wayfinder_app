
import fs from "fs";
import { type Express } from "express";
import path from "path";
import crypto from "crypto";
import { isAuthenticated } from "./auth";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function registerObjectStorageRoutes(app: Express) {
    // 1. Request Upload URL
    // This endpoint mimics the Replit Object Storage behavior by returning a URL that the client uses to upload the file.
    app.post("/api/uploads/request-url", isAuthenticated, (req, res) => {
        const { name, size, contentType } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Missing required field: name" });
        }

        // Generate a unique filename to avoid collisions
        const ext = path.extname(name);
        const basename = path.basename(name, ext).replace(/[^a-zA-Z0-9]/g, "_"); // sanitize
        const uniqueName = `${basename}-${crypto.randomBytes(8).toString("hex")}${ext}`;

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
        const filepath = path.join(UPLOADS_DIR, filename);

        // Basic security check: ensure filename doesn't contain path traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return res.status(400).json({ error: "Invalid filename" });
        }

        const writeStream = fs.createWriteStream(filepath);

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

        const filepath = path.join(UPLOADS_DIR, filename);

        if (fs.existsSync(filepath)) {
            res.sendFile(filepath);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    });
}
