const express = require('express');
const router = express.Router();
var fetchuser = require('../middleware/fetchuser');
const Note = require('../models/Notes');
const { body, validationResult } = require('express-validator');


// Route 1: get all the notes : GET "api/"
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error.");
    }
})


// Route 2: Add a new note : POST "api/"
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'description must be atleast 5 characters').isLength({ min: 5 })
], async (req, res) => {
    try {
        //if validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, tag } = req.body;

        const note = new Note({
            title, description, tag, user: req.user.id
        })

        const savedNote = await note.save();
        res.json(savedNote);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error.");
    }
})


// Route 3: update notes : PUT "api/"
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;

        const newNote = {};
        if (title) { newNote.title = title }
        if (description) { newNote.description = description }
        if (tag) { newNote.tag = tag }

        //find the note to be updated
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send("Note Not Found!!");
        }

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("NOt Allowed");
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });

        res.json({ note });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error.");
    }
})


router.delete('/deletenote/:id',fetchuser,async (req,res)=> {
    //find the note to be deleted
    let note = await Note.findById(req.params.id);
    if (!note) {
        return res.status(404).send("Note Not Found!!");
    }

    if (note.user.toString() !== req.user.id) {
        return res.status(401).send("NOt Allowed");
    }

    note = await Note.findByIdAndDelete(req.params.id);

    res.status(200).send("Note Deleted!!");
})

module.exports = router 