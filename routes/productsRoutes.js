var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const productModel = require('./../models/products');
const categoryModel = require('./../models/category');
const multer = require('multer');
const { adminAuthMiddleware, userAuthMiddleware } = require('./../helpers/jwt');
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API to manage products.
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Retrieve a list of products or a specific product by ID or category.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: The product ID.
 *       - in: query
 *         name: categoryid
 *         schema:
 *           type: string
 *         description: The category ID to filter products.
 *     responses:
 *       200:
 *         description: List of products or single product details.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/', userAuthMiddleware, async (req, res) => {
    try {
        if (req.query.id) {
            const product = await productModel.findById(req.query.id).select('name image -_id').populate('category');
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
            return res.status(200).json(product);
        } else if (req.query.categoryid) {
            const products = await productModel.find({ category: req.query.categoryid }).populate('category');
            if (products.length === 0) return res.status(404).json({ success: false, message: 'No products found for the given category' });
            return res.status(200).json(products);
        } else {
            const data = await productModel.find().populate('category');
            return res.status(200).json(data);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Add a new product.
 *     tags: [Products]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         type: string
 *         description: Name of the product.
 *       - in: formData
 *         name: image
 *         type: file
 *         description: Product image file.
 *       - in: formData
 *         name: category
 *         type: string
 *         description: Category ID.
 *       - in: formData
 *         name: description
 *         type: string
 *         description: Description of the product.
 *       - in: formData
 *         name: price
 *         type: number
 *         description: Price of the product.
 *     responses:
 *       200:
 *         description: Product added successfully.
 *       400:
 *         description: Invalid category or image.
 *       500:
 *         description: Internal server error.
 */
router.post('/', uploadOptions.single('image'), adminAuthMiddleware, async (req, res) => {
    try {
        const category = await categoryModel.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category');

        const file = req.file;
        if (!file) return res.status(400).send('No image provided');

        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;

        const newProduct = new productModel({
            name: req.body.name,
            description: req.body.description,
            image: `${basePath}/${fileName}`,
            category: req.body.category,
            price: req.body.price,
        });

        const response = await newProduct.save();
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/products:
 *   put:
 *     summary: Update a product.
 *     tags: [Products]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID.
 *       - in: formData
 *         name: name
 *         type: string
 *         description: Name of the product.
 *       - in: formData
 *         name: image
 *         type: file
 *         description: Product image file.
 *       - in: formData
 *         name: price
 *         type: number
 *         description: Price of the product.
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/', adminAuthMiddleware, uploadOptions.single('image'), async (req, res) => {
    try {
        const productId = req.headers['id'];
        if (!productId) return res.status(400).json({ message: 'Product ID is required in headers' });

        const category = await categoryModel.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category');

        let imagePath;
        const file = req.file;
        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
            imagePath = `${basePath}/${fileName}`;
        }

        const updateProduct = {
            name: req.body.name,
            image: imagePath || req.body.image,
            price: req.body.price,
        };

        const response = await productModel.findByIdAndUpdate(productId, updateProduct, { new: true, runValidators: true });
        if (!response) return res.status(404).json({ message: 'Product not found' });

        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/products:
 *   delete:
 *     summary: Delete a product.
 *     tags: [Products]
 *     parameters:
 *       - in: header
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID.
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/', adminAuthMiddleware, async (req, res) => {
    try {
        const productId = req.headers['id'];
        if (!productId) return res.status(400).json({ message: 'Product ID is required in headers' });

        const response = await productModel.findByIdAndDelete(productId);
        if (!response) return res.status(404).json({ message: 'Product not found' });

        res.status(200).json({ message: 'Product Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
