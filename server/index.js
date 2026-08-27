import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.jsonl");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, "");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/submissions", async (req, res) => {
  const { name, categories, assignments } = req.body ?? {};

  if (!Array.isArray(categories) || typeof assignments !== "object" || assignments === null) {
    return res.status(400).json({ error: "Request must include `categories` (array) and `assignments` (object)." });
  }

  const id = randomUUID();
  const trimmedName = typeof name === "string" ? name.trim().slice(0, 200) : "";

  const record = {
    id,
    // Falls back to the generated id so every record has a non-empty label, even
    // when the user leaves the optional name field blank.
    name: trimmedName || id,
    submittedAt: new Date().toISOString(),
    categories,
    assignments,
  };

  await fsp.appendFile(SUBMISSIONS_FILE, JSON.stringify(record) + "\n", "utf8");

  res.status(201).json({ id: record.id, name: record.name, submittedAt: record.submittedAt });
});

app.get("/api/submissions/count", async (_req, res) => {
  const contents = await fsp.readFile(SUBMISSIONS_FILE, "utf8");
  const count = contents.split("\n").filter((line) => line.trim().length > 0).length;
  res.json({ count });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Survey map API listening on http://localhost:${PORT}`);
});
