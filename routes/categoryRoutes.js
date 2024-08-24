var express = require('express');
var router = express.Router();

const categoryModel = require('./../models/category');
const user = require('./../models/users');

const { jwtAuthMiddleware } = require('./../helpers/jwt');


// Get the Category details
router.get('/', async (req, res) => {
    try {
        const data = await categoryModel.find();
        console.log('Category data recived');
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

// Find category by Id
router.get('/:id', async (req, res) => {
    try {
        const category = await categoryModel.findById(req.params.id);
        if (!category) {
            res.status(500).json({ message: 'The category with the given Id was not found' })
        }
        res.status(200).send(category);
    } catch (err) {

    }

})

// Add Category details
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const data = req.body; //Assuming request body contain the user data
        // Create a new user using model
        const newCategory = new categoryModel(data);
        const response = await newCategory.save();
        console.log('Data Saved');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

// Update loan details
router.put('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const categoryId = req.headers['id']; // Extract the id from the request headers
        if (!categoryId) {
            return res.status(400).json({ message: 'Category Id is required in headers' });
        }
        const updateCategory = req.body;

        const response = await categoryModel.findByIdAndUpdate(
            categoryId, updateCategory, {
            new: true, //Purpose: This option specifies that the callback function should return the modified document rather tha
            runValidators: true //Purpose: This option ensures that any validation rules defined in the Mongoose schema are enfor
        }
        );
        if (!response) {
            return res.status(404).json({ message: 'Category not found' });
        }
        console.log('Data Updated');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

// Delete loan details
router.delete('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const categoryId = req.headers['id']; // Extract the id from the request headers
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required in headers' });
        }
        const response = await categoryModel.findByIdAndDelete(categoryId);
        if (!response) {
            return res.status(404).json({ message: 'Product not found' });
        }
        console.log(response);
        res.status(200).json({ message: 'Product Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

module.exports = router;