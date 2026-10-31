
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Notes file path
const dataFolder = path.join(__dirname, "data");
const filePath = path.join(dataFolder, "notes.json");

// Create data folder and notes.json if they do not exist
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
}

// Read notes from JSON file
function getNotes() {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading notes:", error);
        return [];
    }
}

// Save notes to JSON file
function saveNotes(notes) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(notes, null, 4),
        "utf8"
    );
}

// Validate note input
function validateNote(req, res, next) {
    const { title, content } = req.body;

    if (
        typeof title !== "string" ||
        typeof content !== "string" ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: "Title and content are required."
        });
    }

    req.noteData = {
        title: title.trim(),
        content: content.trim()
    };

    next();
}

// GET: Display all notes
app.get("/notes", (req, res) => {
    const notes = getNotes();
    res.json(notes);
});

// POST: Add a new note
app.post("/notes", validateNote, (req, res) => {
    const notes = getNotes();

    const newNote = {
        id: randomUUID(),
        title: req.noteData.title,
        content: req.noteData.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    saveNotes(notes);

    res.status(201).json({
        message: "Note added successfully",
        note: newNote
    });
});

// PUT: Update an existing note
app.put("/notes/:id", validateNote, (req, res) => {
    const notes = getNotes();

    const noteIndex = notes.findIndex(
        note => note.id === req.params.id
    );

    if (noteIndex === -1) {
        return res.status(404).json({
            message: "Note not found."
        });
    }

    notes[noteIndex] = {
        ...notes[noteIndex],
        title: req.noteData.title,
        content: req.noteData.content,
        updatedAt: new Date().toISOString()
    };

    saveNotes(notes);

    res.json({
        message: "Note updated successfully",
        note: notes[noteIndex]
    });
});

// DELETE: Delete a note
app.delete("/notes/:id", (req, res) => {
    const notes = getNotes();

    const updatedNotes = notes.filter(
        note => note.id !== req.params.id
    );

    if (updatedNotes.length === notes.length) {
        return res.status(404).json({
            message: "Note not found."
        });
    }

    saveNotes(updatedNotes);

    res.json({
        message: "Note deleted successfully"
    });
});

// Handle invalid API routes
app.use("/notes", (req, res) => {
    res.status(404).json({
        message: "API route not found."
    });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400) {
        return res.status(400).json({
            message: "Invalid JSON data."
        });
    }

    console.error(err);
    res.status(500).json({
        message: "Internal server error."
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Quick Note Application running at http://localhost:${PORT}`);
});
