import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Admin Email
const ADMIN_EMAIL = "mehedinehalll@gmail.com"; 

const addBookForm = document.getElementById("add-book-form");
const booksTableBody = document.getElementById("books-table-body");
const searchInput = document.getElementById("search-input");
const actionsHeader = document.getElementById("actions-header");

let allBooks = [];
let currentUser = null;

// Auth Check & Role Control
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    // Hide "Add New Book" form if user is not Admin
    if (addBookForm) {
        const addBookSection = addBookForm.parentElement;
        if (user && user.email === ADMIN_EMAIL) {
            addBookForm.style.display = "flex";
            if (actionsHeader) actionsHeader.style.display = "";
        } else {
            addBookForm.style.display = "none";
            const formTitle = addBookSection.querySelector("h2");
            if (formTitle && formTitle.textContent.includes("Add New Book")) {
                formTitle.style.display = "none";
            }
            if (actionsHeader) actionsHeader.style.display = "none";
        }
    }
    
    loadBooks();
});

async function loadBooks() {
    if (!booksTableBody) return;
    booksTableBody.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "books"));
    allBooks = [];
    querySnapshot.forEach((docSnap) => {
        allBooks.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderBooks(allBooks);
}

function renderBooks(books) {
    booksTableBody.innerHTML = "";
    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

    books.forEach((book) => {
        const row = document.createElement("tr");
        
        let actionButtons = "";
        if (isAdmin) {
            actionButtons = `
                <td>
                    <button class="btn btn-warning edit-btn" data-id="${book.id}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${book.id}">Delete</button>
                </td>
            `;
        }

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            ${actionButtons}
        `;
        booksTableBody.appendChild(row);
    });

    if (isAdmin) {
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.getAttribute("data-id");
                await deleteDoc(doc(db, "books", id));
                loadBooks();
            });
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.getAttribute("data-id");
                const newTitle = prompt("Enter new title:");
                if (newTitle) {
                    await updateDoc(doc(db, "books", id), { title: newTitle });
                    loadBooks();
                }
            });
        });
    }
}

if (addBookForm) {
    addBookForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("book-title").value;
        const author = document.getElementById("book-author").value;
        const genre = document.getElementById("book-genre").value;

        await addDoc(collection(db, "books"), { title, author, genre });
        addBookForm.reset();
        loadBooks();
    });
}

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allBooks.filter(book => 
            book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term)
        );
        renderBooks(filtered);
    });
}