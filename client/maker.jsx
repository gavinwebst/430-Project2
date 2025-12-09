const helper = require('./helper.js');
const React = require('react');
const {useState, useEffect} = React;
const { createRoot } = require('react-dom/client');

const handleBook = (e, onBookAdded) => {
    e.preventDefault();
    helper.hideError();

    const title = e.target.querySelector('#bookTitle').value;
    const author = e.target.querySelector('#bookAuthor').value;
    const pages = e.target.querySelector('#bookPages').value;
    const year = e.target.querySelector('#bookYear').value;

    if(!title || !author || !pages || !year) {
        helper.handleError("All fields are required");
        return false;
    }

    helper.sendPost(e.target.action, {title, author, pages, year}, onBookAdded);
    return false;
}

const handlePurchaseFakeProfit = async () => {
    helper.hideError();
    try {
        const response = await fetch('/purchaseFakeProfit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        
        if (!response.ok) {
            helper.handleError(data.error || 'Failed to purchase Fake Profit');
        } else {
            helper.handleError('Fake Profit purchased! You now have unlimited book tracking!', true);
            // Reload page to update UI
            window.location.reload();
        }
    } catch (err) {
        helper.handleError('Error purchasing Fake Profit');
    }
};

const BookForm = (props) => {
    return (
        <form id="bookForm"
            onSubmit={(e) => handleBook(e, props.triggerReload)}
            name="bookForm"
            action="/maker"
            method="POST"
            className="bookForm"
        >
            <label htmlFor="title">Title: </label>
            <input id="bookTitle" type="text" name="title" placeholder="Book Title" />
            <label htmlFor="author">Author: </label>
            <input id="bookAuthor" type="text" name="author" placeholder="Book Author" />
            <label htmlFor="pages">Pages: </label>
            <input id="bookPages" type="number" min="0" name="pages" />
            <label htmlFor="year">Year: </label>
            <input id="bookYear" type="number" min="0" name="year" />
            <input className="makeBookSubmit" type="submit" value="Make Book" />
        </form>
    );
};

const PremiumButton = (props) => {
    if (props.hasUnlimitedBooks) {
        return (
            <div className="premiumStatus">
                <p>✓ Premium Member - Unlimited Books Enabled</p>
            </div>
        );
    }

    return (
        <div className="premiumSection">
            <p>Free users can track up to 5 books.</p>
            <button 
                onClick={handlePurchaseFakeProfit}
                className="purchaseButton"
            >
                Purchase Fake Profit - Unlimited Books
            </button>
        </div>
    );
};

const BookList = (props) => {
    const [books, setBooks] = useState(props.books);

    useEffect(() =>{
        const loadBooksFromServer = async () => {
            const response = await fetch('/getBooks');
            const data = await response.json();
            setBooks(data.books);
        };
        loadBooksFromServer();
        
    }, [props.reloadBooks]);

    const updatePagesRead = async (bookId, newPagesRead, maxPages) => {
        if (newPagesRead < 0 || newPagesRead > maxPages) {
            helper.handleError(`Pages read must be between 0 and ${maxPages}`);
            return;
        }

        try {
            const response = await fetch('/updatePagesRead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookId, pagesRead: newPagesRead })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                helper.handleError(data.error || 'Failed to update pages read');
            } else {
                // Reload books from server
                const booksResponse = await fetch('/getBooks');
                const booksData = await booksResponse.json();
                setBooks(booksData.books);
            }
        } catch (err) {
            helper.handleError('Error updating pages read');
        }
    };

    if(books.length === 0) {
        return (
            <div className="bookList">
                <h3 className="emptyBook">No Books Yet!</h3>
            </div>
        );
    }

    const bookNodes = books.map(book =>{
        const progressPercent = book.pages > 0 ? (book.pagesRead / book.pages) * 100 : 0;
        
        return (
            <div key={book._id} className="book">
                <img src="/assets/img/bookImage.png" alt="book image" className="domoFace" />
                <h3 className="bookTitle">Title: {book.title}</h3>
                <h3 className="bookAuthor">Author: {book.author}</h3>
                <h3 className="bookPages">Pages: {book.pages}</h3>
                <h3 className="bookYear">Year: {book.year}</h3>
                
                <div className="readingProgress">
                    <label htmlFor={`pages-${book._id}`}>Pages Read: {book.pagesRead} / {book.pages}</label>
                    <div className="progressBar">
                        <div className="progressFill" style={{width: `${progressPercent}%`}}></div>
                    </div>
                    <input 
                        id={`pages-${book._id}`}
                        type="number" 
                        min="0" 
                        max={book.pages}
                        value={book.pagesRead}
                        onChange={(e) => updatePagesRead(book._id, parseInt(e.target.value), book.pages)}
                        className="pagesInput"
                    />
                </div>
            </div>
        );
    });

    return (
        <div className="bookList">
            {bookNodes}
        </div>
    );
};

const App = () => {
    const [reloadBooks, setReloadBooks] = useState(false);
    const [hasUnlimitedBooks, setHasUnlimitedBooks] = useState(false);

    useEffect(() => {
        // Get current user's premium status from window or fetch it
        const checkPremiumStatus = async () => {
            try {
                // Check if there's a way to get user data - alternatively check from session
                // For now we'll rely on the button click to update
                const premiumElement = document.querySelector('[data-has-unlimited]');
                if (premiumElement) {
                    setHasUnlimitedBooks(premiumElement.dataset.hasUnlimited === 'true');
                }
            } catch (err) {
                console.log('Could not check premium status');
            }
        };
        checkPremiumStatus();
    }, []);

    return(
        <div>
            <div id="makeBook">
                <PremiumButton hasUnlimitedBooks={hasUnlimitedBooks} />
                <BookForm triggerReload={() => setReloadBooks(!reloadBooks)} />
            </div>
            <div id="books">
                <BookList books={[]} reloadBooks={reloadBooks} />
            </div>
        </div>
    );
};

const init = () =>{
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
}

window.onload = init;
