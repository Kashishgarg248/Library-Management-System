let books = JSON.parse(localStorage.getItem('books')) || [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', stock: 3 }
];

let borrowed = JSON.parse(localStorage.getItem('borrowed')) || {};

let currentUser = null;
const users = {
  admin: 'admin123',
  student1: 'pass1',
  student2: 'pass2'
};

function login() {
  const userId = document.getElementById('userId').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (users[userId] && users[userId] === password) {
    currentUser = userId;
    document.body.classList.add('logged-in');

    document.querySelector('.login-section').classList.add('hidden');
    document.getElementById('logout-section').classList.remove('hidden');
    document.getElementById('available-section').classList.remove('hidden');
    document.getElementById('borrowed-section').classList.remove('hidden');

    if (currentUser === 'admin') {
      document.getElementById('admin-panel').classList.remove('hidden');
    } else {
      document.getElementById('admin-panel').classList.add('hidden');
    }

    displayBooks();
  } else {
    alert('Invalid credentials. Try admin/admin123 or student1/pass1 or student2/pass2');
  }
}

function logout() {
  currentUser = null;
  document.body.classList.remove('logged-in');

  document.querySelector('.login-section').classList.remove('hidden');
  document.getElementById('logout-section').classList.add('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('available-section').classList.add('hidden');
  document.getElementById('borrowed-section').classList.add('hidden');

  document.getElementById('userId').value = '';
  document.getElementById('password').value = '';
}

function addBook() {
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const stock = parseInt(document.getElementById('stock').value);

  if (!title || !author || isNaN(stock) || stock <= 0) {
    alert('Please enter valid book title, author, and positive stock quantity.');
    return;
  }

  books.push({ title, author, stock });
  localStorage.setItem('books', JSON.stringify(books));

  document.getElementById('title').value = '';
  document.getElementById('author').value = '';
  document.getElementById('stock').value = '';

  displayBooks();
}

// Remove book by admin
function removeBook(index) {
  // Check if any user borrowed this book
  const isBorrowed = Object.values(borrowed).includes(index);
  if (isBorrowed) {
    alert('Cannot remove this book. It is currently borrowed by a user.');
    return;
  }

  books.splice(index, 1);

  // Update borrowed entries after removal (adjust indexes)
  for (const user in borrowed) {
    if (borrowed[user] > index) {
      borrowed[user] -= 1; // shift index left
    } else if (borrowed[user] === index) {
      delete borrowed[user]; // safety net (shouldn't happen as we check above)
    }
  }

  localStorage.setItem('books', JSON.stringify(books));
  localStorage.setItem('borrowed', JSON.stringify(borrowed));
  displayBooks();
}

function displayBooks() {
  const availableList = document.getElementById('available-books');
  const borrowedList = document.getElementById('borrowed-books');
  const adminBorrowedList = document.getElementById('admin-borrowed');
  const adminAvailableList = document.getElementById('admin-available-books');

  availableList.innerHTML = '';
  borrowedList.innerHTML = '';
  if (adminBorrowedList) adminBorrowedList.innerHTML = '';
  if (adminAvailableList) adminAvailableList.innerHTML = '';

  if (currentUser === 'admin') {
    // Admin view: Show books with Remove button
    books.forEach((book, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${book.title}</strong> by ${book.author} - Stock: ${book.stock}`;

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.classList.add('remove-btn');
      removeBtn.onclick = () => {
        if (confirm(`Are you sure you want to remove "${book.title}"?`)) {
          removeBook(index);
        }
      };
      li.appendChild(removeBtn);

      adminAvailableList.appendChild(li);
    });

    // Borrowed books info
    const borrowedEntries = Object.entries(borrowed);
    if (borrowedEntries.length === 0) {
      adminBorrowedList.innerHTML = '<li>No books currently borrowed.</li>';
    } else {
      borrowedEntries.forEach(([user, bookIndex]) => {
        const book = books[bookIndex];
        if (book) {
          const borrowedLi = document.createElement('li');
          borrowedLi.textContent = `${user} borrowed: "${book.title}"`;
          adminBorrowedList.appendChild(borrowedLi);
        }
      });
    }
    return;
  }

  // For students:
  if (borrowed[currentUser] !== undefined) {
    const bookIndex = borrowed[currentUser];
    const book = books[bookIndex];
    if (book) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${book.title}</strong> by ${book.author}`;
      const returnBtn = document.createElement('button');
      returnBtn.textContent = 'Return';
      returnBtn.classList.add('return-btn');
      returnBtn.onclick = () => returnBook();
      li.appendChild(returnBtn);
      borrowedList.appendChild(li);
    }
  } else {
    borrowedList.innerHTML = '<li>No books borrowed currently.</li>';
  }

  if (borrowed[currentUser] === undefined) {
    books.forEach((book, index) => {
      if (book.stock > 0) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${book.title}</strong> by ${book.author} - Stock: ${book.stock}`;
        const borrowBtn = document.createElement('button');
        borrowBtn.textContent = 'Borrow';
        borrowBtn.onclick = () => borrowBook(index);
        li.appendChild(borrowBtn);
        availableList.appendChild(li);
      }
    });
    if (availableList.children.length === 0) {
      availableList.innerHTML = '<li>No books available at the moment.</li>';
    }
  } else {
    availableList.innerHTML = '<li>Return your borrowed book to borrow another.</li>';
  }
}

function borrowBook(index) {
  if (borrowed[currentUser] !== undefined) {
    alert('You can only borrow one book at a time.');
    return;
  }

  if (books[index].stock <= 0) {
    alert('Sorry, this book is out of stock.');
    return;
  }

  books[index].stock -= 1;
  borrowed[currentUser] = index;

  localStorage.setItem('books', JSON.stringify(books));
  localStorage.setItem('borrowed', JSON.stringify(borrowed));

  alert(`You borrowed "${books[index].title}". Please return it within 7 days.`);
  displayBooks();
  scheduleNotification(books[index].title);
}

function returnBook() {
  const bookIndex = borrowed[currentUser];
  if (bookIndex === undefined) {
    alert('You have not borrowed any book.');
    return;
  }

  books[bookIndex].stock += 1;
  delete borrowed[currentUser];

  localStorage.setItem('books', JSON.stringify(books));
  localStorage.setItem('borrowed', JSON.stringify(borrowed));

  alert('Thank you for returning the book!');
  displayBooks();
}

function scheduleNotification(bookTitle) {
  setTimeout(() => {
    alert(`Reminder: The book "${bookTitle}" is due today. Please return it.`);
  }, 5000);
}
