const models = require('../models');

const { Book } = models;

const makerPage = async (req, res) => res.render('app');

const makeBook = async (req, res) => {
    if(!req.body.title || !req.body.author || !req.body.pages || !req.body.year) {
        return res.status(400).json({
            error: 'All of the Fields are required!'
        });
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
        const docs = await Book.find(query).select('title author page year').lean().exec();

        return res.json({ books : docs});
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: 'Erro retrieving books! '});
    }
};

module.exports = {
    makerPage,
    makeBook,
    getBooks,
}
