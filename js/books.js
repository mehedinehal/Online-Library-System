import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    serverTimestamp,
    query,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 👑 Admin Email Check Constraint
const ADMIN_EMAIL = "mehedinehalll@gmail.com";

// DOM Elements
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');
const addBookForm = document.getElementById('add-book-form');
const formSection = document.querySelector('.form-section');
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search-input');

let allBooks = []; // Store fetched books locally for live search filter
let currentUser = null;
let isAdmin = false;

// 1. Authentication Check & Role Verification
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isAdmin = (user.email === ADMIN_EMAIL);

        // Display user email & role badge
        if (userEmailDisplay) {
            userEmailDisplay.innerHTML = `${user.email} ${isAdmin ? '<b style="color: #34d399; margin-left: 5px;">(Admin)</b>' : '<span style="color: #94a3b8; margin-left: 5px;">(User)</span>'}`;
        }

        // Hide "Add New Book" form if not Admin
        if (formSection) {
            if (isAdmin) {
                formSection.style.display = 'block';
            } else {
                formSection.style.display = 'none';
            }
        }

        // Fetch Books from Firestore
        fetchBooks();
    } else {
        // Redirect to login page if user is not logged in
        window.location.href = "login.html";
    }
});

// 2. Logout Handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            alert("Error logging out: " + error.message);
        }
    });
}

// 3. Add Book (Admin Only)
if (addBookForm) {
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            alert("Only Admin can add books!");
            return;
        }

        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const genre = document.getElementById('book-genre').value.trim();

        if (!title || !author || !genre) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            await addDoc(collection(db, "books"), {
                title: title,
                author: author,
                genre: genre,
                createdAt: serverTimestamp()
            });

            addBookForm.reset();
            fetchBooks(); // Reload list
        } catch (error) {
            alert("Error adding book: " + error.message);
        }
    });
}

// 4. Fetch Books Realtime / Standard Load
async function fetchBooks() {
    if (!bookList) return;

    bookList.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading books...</td></tr>';

    try {
        const booksQuery = query(collection(db, "books"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(booksQuery);
        
        allBooks = [];
        querySnapshot.forEach((docSnap) => {
            allBooks.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderBooks(allBooks);
    } catch (error) {
        console.error("Error fetching books:", error);
        bookList.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #ef4444;">Failed to load books.</td></tr>';
    }
}

// 5. Render Books in Table
function renderBooks(books) {
    bookList.innerHTML = '';

    if (books.length === 0) {
        bookList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No books found.</td></tr>';
        return;
    }

    books.forEach((book) => {
        const tr = document.createElement('tr');

        // Check if current user is admin to render Edit/Delete buttons
        const actionButtonsHTML = isAdmin ? `
            <div class="action-btns">
                <button class="btn-sm btn-edit" data-id="${book.id}" data-title="${book.title}" data-author="${book.author}" data-genre="${book.genre}">Edit</button>
                <button class="btn-sm btn-delete" data-id="${book.id}">Delete</button>
            </div>
        ` : `<span style="color: #64748b; font-size: 0.85rem;">View Only</span>`;

        tr.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td class="text-center">${actionButtonsHTML}</td>
        `;

        bookList.appendChild(tr);
    });

    // Attach Event Listeners to Edit and Delete Buttons (if Admin)
    if (isAdmin) {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', handleDeleteBook);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', handleEditBook);
        });
    }
}

// 6. Delete Book (Admin Only)
async function handleDeleteBook(e) {
    if (!isAdmin) return;

    const bookId = e.target.getAttribute('data-id');
    if (confirm("Are you sure you want to delete this book?")) {
        try {
            await deleteDoc(doc(db, "books", bookId));
            fetchBooks();
        } catch (error) {
            alert("Error deleting book: " + error.message);
        }
    }
}

// 7. Edit Book (Admin Only)
async function handleEditBook(e) {
    if (!isAdmin) return;

    const bookId = e.target.getAttribute('data-id');
    const oldTitle = e.target.getAttribute('data-title');
    const oldAuthor = e.target.getAttribute('data-author');
    const oldGenre = e.target.getAttribute('data-genre');

    const newTitle = prompt("Edit Book Title:", oldTitle);
    if (newTitle === null) return; // Cancelled

    const newAuthor = prompt("Edit Author:", oldAuthor);
    if (newAuthor === null) return;

    const newGenre = prompt("Edit Genre:", oldGenre);
    if (newGenre === null) return;

    if (!newTitle.trim() || !newAuthor.trim() || !newGenre.trim()) {
        alert("Fields cannot be empty.");
        return;
    }

    try {
        await updateDoc(doc(db, "books", bookId), {
            title: newTitle.trim(),
            author: newAuthor.trim(),
            genre: newGenre.trim()
        });
        fetchBooks();
    } catch (error) {
        alert("Error updating book: " + error.message);
    }
}

// 8. Live Search Functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        const filteredBooks = allBooks.filter(book => {
            const titleMatch = book.title && book.title.toLowerCase().includes(searchTerm);
            const authorMatch = book.author && book.author.toLowerCase().includes(searchTerm);
            const genreMatch = book.genre && book.genre.toLowerCase().includes(searchTerm);

            return titleMatch || authorMatch || genreMatch;
        });

        renderBooks(filteredBooks);
    });
}