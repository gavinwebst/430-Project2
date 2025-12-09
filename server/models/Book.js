const mongoose = require('mongoose');
const _ = require('underscore');

const setTitle = (title) => _.escape(title).trim();

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        set: setTitle,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    pages: {
        type: Number,
        required: true,
        min: 0,
    },
    pagesRead: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
    },
    year: {
        type: Number,
        required: true,
        min: 0,
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'Account',
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
});

BookSchema.statics.toAPI = (doc) => ({
    title: doc.title,
    author: doc.author,
    pages: doc.pages,
    pagesRead: doc.pagesRead,
    year: doc.year,
});

const BookModel = mongoose.model('Book', BookSchema);
module.exports = BookModel;