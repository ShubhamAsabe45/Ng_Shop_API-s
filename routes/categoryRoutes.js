var express = require('express');
var router = express.Router();

const categoryModel = require('./../models/category');
const { jwtAuthMiddleware } = require('./../helpers/jwt');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
    try {
        const data = await categoryModel.find();
        console.log('Category data received');
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Find category by ID
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the category to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get('/:id', async (req, res) => {
    try {
        const category = await categoryModel.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'The category with the given ID was not found' });
        }
        res.status(200).json(category);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Add a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const data = req.body; // Assuming request body contains the category data
        const newCategory = new categoryModel(data);
        const response = await newCategory.save();
        console.log('Data Saved');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /category:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Category not found
 */
router.put('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const categoryId = req.headers['id']; // Extract the id from the request headers
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required in headers' });
        }
        const updateCategory = req.body;

        const response = await categoryModel.findByIdAndUpdate(
            categoryId, updateCategory, {
                new: true, // Return the modified document rather than the original
                runValidators: true // Enforce validation rules defined in the schema
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

/**
 * @swagger
 * /category:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: header
 *         required: true
 *         description: ID of the category to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Category not found
 */
router.delete('/', jwtAuthMiddleware, async (req, res) => {
    try {
        const categoryId = req.headers['id']; // Extract the id from the request headers
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required in headers' });
        }
        const response = await categoryModel.findByIdAndDelete(categoryId);
        if (!response) {
            return res.status(404).json({ message: 'Category not found' });
        }
        console.log(response);
        res.status(200).json({ message: 'Category deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

module.exports = router;
