
const noteForm = document.getElementById("noteForm");

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

const notesContainer =
    document.getElementById("notesContainer");

const noteCount = document.getElementById("noteCount");
const message = document.getElementById("message");

const submitButton =
    document.getElementById("submitButton");

const cancelButton =
    document.getElementById("cancelButton");

// Track which note is being edited
let editingNoteId = null;

// GET: Fetch all notes
async function loadNotes() {
    try {
        const response = await fetch("/notes");

        if (!response.ok) {
            throw new Error("Failed to load notes");
        }

        const notes = await response.json();

        displayNotes(notes);

    } catch (error) {
        notesContainer.textContent = "Unable to load notes.";
    }
}

// Display all notes

function displayNotes(notes) {
    notesContainer.innerHTML = "";

    notes.forEach(note => {
        const noteCard = document.createElement("div");
        noteCard.className = "note-card";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content;

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", () => {
            editNote(note);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id);
        });

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "note-buttons";

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        noteCard.appendChild(title);
        noteCard.appendChild(content);
        noteCard.appendChild(buttonContainer);

        notesContainer.appendChild(noteCard);
    });
}

function editNote(note) {

    editingNoteId = note.id;

    // Display saved data in the top form
    titleInput.value = note.title;
    contentInput.value = note.content;

    // Change button text
    submitButton.textContent = "Save Changes";

    // Show cancel button
    cancelButton.hidden = false;

    message.textContent = "Editing selected note...";

    // Scroll to the top form
    noteForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    titleInput.focus();
}

// Reset form and exit editing mode
function resetForm() {

    editingNoteId = null;

    noteForm.reset();

    submitButton.textContent = "+ Add Note";

    cancelButton.hidden = true;

    message.textContent = "";
}

// Cancel editing
cancelButton.addEventListener("click", resetForm);

// Submit: Add or Update a note
noteForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        message.textContent = "Please fill in both fields.";
        return;
    }

    try {

        const isEditing = editingNoteId !== null;

        const url = isEditing
            ? `/notes/${encodeURIComponent(editingNoteId)}`
            : "/notes";

        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title,
                content: content
            })

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        message.textContent = isEditing
            ? "Note updated successfully!"
            : "Note added successfully!";

        resetForm();

        await loadNotes();

    } catch (error) {

        message.textContent =
            error.message || "Something went wrong.";

    }
});

// DELETE: Delete a note
async function deleteNote(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `/notes/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        if (editingNoteId === id) {
            resetForm();
        }

        message.textContent = "Note deleted successfully!";

        await loadNotes();

    } catch (error) {

        message.textContent =
            error.message || "Unable to delete note.";

    }
}

// Load notes when page opens
loadNotes();
