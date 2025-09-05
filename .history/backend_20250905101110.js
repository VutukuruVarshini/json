
//http://localhost:8000/people.json

// server.js (JSON-only version)
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import multer from "multer";
import axios from "axios";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json());

// Serve frontend files (index.html, style.css, script.js)
const frontendDir = path.join(process.cwd());
app.use(express.static(frontendDir));

// Default route → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

const PER_PAGE = 6;
const jsonFilePath = path.join(process.cwd(), "people.json");

// External JSON links
const JSON_LINKS = [
  "https://reqres.in/api/users?page=1",
  "https://reqres.in/api/users?page=2"
];

// --- Uploads folder ---
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));

// --- Helpers ---
function readJSON() {
  if (!fs.existsSync(jsonFilePath)) return [];
  const data = fs.readFileSync(jsonFilePath, "utf-8");
  return JSON.parse(data);
}

function writeJSON(data) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
}

// --- Sync external JSON links ---
async function syncJSONLinks() {
  for (const link of JSON_LINKS) {
    try {
      const res = await axios.get(link);
      const jsonData = res.data.data || res.data;
      const currentData = readJSON();

      for (const person of jsonData) {
        if (!currentData.some(p => p.email === person.email)) {
          currentData.push(person);
        }
      }

      writeJSON(currentData);
      console.log(`✅ Synced ${link}`);
    } catch (err) {
      console.error(`Error syncing ${link}:`, err.message);
    }
  }
}

// Initial sync
if (!fs.existsSync(jsonFilePath)) writeJSON([]);
syncJSONLinks();
setInterval(syncJSONLinks, 5 * 60 * 1000); // every 5 minutes

// --- API Endpoints ---

// GET all people (paginated)
app.get("/people", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = readJSON();
  const total = data.length;
  const total_pages = Math.ceil(total / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const results = data.slice(start, start + PER_PAGE);
  res.json({ page, per_page: PER_PAGE, total, total_pages, data: results });
});

// GET /people/search
app.get("/people/search", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const data = readJSON();
  const results = data.filter(p => p.email === email);
  res.json({ data: results });
});

// POST /people
app.post("/people", (req, res) => {
  const { first_name, last_name, email, avatar } = req.body;
  if (!first_name || !last_name || !email) return res.status(400).json({ error: "All fields are required" });

  const data = readJSON();
  if (data.some(p => p.email === email)) return res.status(400).json({ error: "Duplicate email" });

  const newId = data.length ? Math.max(...data.map(p => p.id || 0)) + 1 : 1;
  const newPerson = { id: newId, first_name, last_name, email, avatar: avatar || "" };
  data.push(newPerson);
  writeJSON(data);

  res.status(201).json(newPerson);
});

// PUT /people/:id
app.put("/people/:id", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, avatar } = req.body;
  const data = readJSON();
  const index = data.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ error: "Person not found" });

  data[index] = { ...data[index], first_name, last_name, email, avatar };
  writeJSON(data);
  res.json({ message: "Profile updated!" });
});

// DELETE /people/:id
app.delete("/people/:id", (req, res) => {
  const { id } = req.params;
  let data = readJSON();
  data = data.filter(p => p.id != id);
  writeJSON(data);
  res.json({ message: "Profile deleted!" });
});

// POST /upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// GET /people.json
app.get("/people.json", (req, res) => {
  if (fs.existsSync(jsonFilePath)) {
    const data = fs.readFileSync(jsonFilePath, "utf-8");
    res.type("json").send(data);
  } else {
    res.status(404).send({ error: "JSON file not found" });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


