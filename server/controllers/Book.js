const models = require('../models');

const { Book, Account } = models;

const BOOK_LIMIT = 5; // Free users can have max 5 books

const makerPage = async (req, res) => res.render('app');

const makeBook = async (req, res) => {
    if(!req.body.title || !req.body.author || !req.body.pages || !req.body.year) {
        return res.status(400).json({
            error: 'All of the Fields are required!'
        });
    }

    // Check book limit for non-unlimited users
    if(!req.session.account.hasUnlimitedBooks) {
        try {
            const bookCount = await Book.countDocuments({ owner: req.session.account._id });
            if(bookCount >= BOOK_LIMIT) {
                return res.status(403).json({
                    error: `You have reached the book limit of ${BOOK_LIMIT}. Purchase Fake Profit to add unlimited books!`
                });
            }
        } catch(err) {
            console.log(err);
            return res.status(500).json({error: 'Error checking book count!'});
        }
    }

    const bookData = {
        title: req.body.title,
        author: req.body.author,
        pages: req.body.pages,
        year: req.body.year,
        owner: req.session.account._id,
    };

    try{
        const newBook = new Book(bookData);
        await newBook.save();
        return res.status(201).json({title: newBook.title, author: newBook.author, pages: newBook.pages, year: newBook.year});
    } catch(err) {
        if(err.code === 11000){
            return res.status(400).json({error: 'Book already exists!'});
        }

        return res.status(500).json({error: 'An error occured making the book! '});
    }
};

const getBooks = async (req, res) => {
    try{
        const query = {owner: req.session.account._id};
        const docs = await Book.find(query).select('title author page year pagesRead').lean().exec();

        return res.json({ books : docs});
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: 'Erro retrieving books! '});
    }
};

const purchakeFakeProfit = async (req, res) => {
    try {
        const accountDoc = await Account.findByIdAndUpdate(
            req.session.account._id,
            { hasUnlimitedBooks: true },
            { new: true }
        );

        if (!accountDoc) {
            return res.status(404).json({ error: 'Account not found!' });
        }

        // Update session with new account data
        req.session.account = Account.toAPI(accountDoc);

        return res.status(200).json({
            message: 'Fake Profit purchased successfully!',
            hasUnlimitedBooks: accountDoc.hasUnlimitedBooks
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error purchasing Fake Profit!' });
    }
};

const updatePagesRead = async (req, res) => {
    if (!req.body.bookId || req.body.pagesRead === undefined) {
        return res.status(400).json({
            error: 'Book ID and pagesRead are required!'
        });
    }

    try {
        const book = await Book.findById(req.body.bookId);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found!' });
        }

        if (book.owner.toString() !== req.session.account._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized!' });
        }

        if (req.body.pagesRead > book.pages) {
            return res.status(400).json({ 
                error: `Pages read cannot exceed total pages (${book.pages})!` 
            });
        }

        book.pagesRead = req.body.pagesRead;
        await book.save();

        return res.status(200).json({
            message: 'Pages read updated!',
            book: Book.toAPI(book)
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error updating pages read!' });
    }
};

module.exports = {
    makerPage,
    makeBook,
    getBooks,
    purchakeFakeProfit,
    updatePagesRead,
}
