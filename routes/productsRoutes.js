var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const productModel = require('./../models/products');
const categoryModel = require('./../models/category');
const multer = require('multer');
const { adminAuthMiddleware, userAuthMiddleware} = require('./../helpers/jwt');

const FILE_TYPE_MAP={
    'image/png':'png',
    'image/jpeg':'jpeg',
    'image/jpg':'jpg'
}
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if(isValid){
            uploadError = null
        }
        cb(null,'public/uploads')
    },
    filename:function(req,file,cb){
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null,`${fileName}-${Date.now()}.${extension}`);
    }
})

var uploadOptions = multer({storage:storage});
// Get the Product details

// http://localhost:8480/api/v1/products
// http://localhost:8480/api/v1/products?id=66c04e79061b3ec99b659fdc
// http://localhost:8480/api/v1/products?categoryid=66c055b0019c065047244457
router.get('/',userAuthMiddleware, async (req, res) => {
    try {
        if (req.query.id) {
            // If an id is provided, return the specific product
            const product = await productModel.findById(req.query.id).select('name image -_id').populate('category');
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            return res.status(200).json(product);
        } else if (req.query.categoryid) {
            // If a categoryid is provided, return products belonging to that category
            const products = await productModel.find({ category: req.query.categoryid }).populate('category');
            if (products.length === 0) {
                return res.status(404).json({ success: false, message: 'No products found for the given category' });
            }
            return res.status(200).json(products);
        } else {
            // Otherwise, return all products
            const data = await productModel.find().populate('category');
            console.log('Products data received');
            return res.status(200).json(data);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
    


// Add Product details
// router.post('/',uploadOptions.single('image'),adminAuthMiddleware, async (req, res) =>{
    // try {
        // To check the category ollld
        // const category = await categoryModel.findById(req.body.category);
        // if(!category) return res.status(400).send('Invalid Category');
        // const fileName = req.file.filename
        // const basePath = `${req.protocol}://${req.get('host')}/public/upload`;
        // const data = req.body; //Assuming request body contain the user data
        // Create a new user using model
        // const newProduct = new productModel(data);
        // const response = await newProduct.save();
        // console.log('Data Saved');
        // res.status(200).json(response);
    // } catch (err) {
        // console.log(err);
        // res.status(500).json({ error: 'Internal server error' });
    // }
// });

router.post('/', uploadOptions.single('image'), adminAuthMiddleware, async (req, res) => {
    try {
        // Check if the category is valid
        const category = await categoryModel.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category');

        // Handle the image file
        const file = req.file;
        if (!file) return res.status(400).send('No image provided');

        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;

        // Create a new product with the image details included
        const newProduct = new productModel({
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription ,
            image: `${basePath}/${fileName}`,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            // dateCreated: req.body.dateCreated || Date.now(),
        });

        const response = await newProduct.save();
        console.log('Product added successfully');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Product details
// router.put('/',adminAuthMiddleware, async (req, res) =>{
    // try {
        // if(!mongoose.isValidObjectId(req.params.id)){
            // res.status(400).send('Invalid category');
        // }
        // const productId = req.headers['id']; // Extract the id from the request headers
        // if (!productId) {
            // return res.status(400).json({ message: 'Product ID is required in headers' });
        // }
        // const updateProduct = req.body;
// 
        // const response = await productModel.findByIdAndUpdate(
            // productId, updateProduct, {
            // new: true, //Purpose: This option specifies that the callback function should return the modified document rather than the original.
            // runValidators: true //Purpose: This option ensures that any validation rules defined in the Mongoose schema are enforced during the updat
        // }
        // );
        // if (!response) {
            // return res.status(404).json({ message: 'Product not found' });
        // }
        // console.log('Data Updated');
        // res.status(200).json(response);
// 
    // } catch (err) {
        // console.log(err);
        // res.status(500).json({ error: 'Internal server error' });
    // }
// });

// Update Product details
router.put('/', adminAuthMiddleware, uploadOptions.single('image'), async (req, res) => {
    try {
        const productId = req.headers['id']; // Extract the id from the request headers
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required in headers' });
        }

        // Validate category
        const category = await categoryModel.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category');

        // Handle the image file
        let imagePath;
        const file = req.file;
        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
            imagePath = `${basePath}/${fileName}`;
        }

        // Prepare the update object
        const updateProduct = {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath || req.body.image,  // Retain the old image if no new image is uploaded
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        };

        const response = await productModel.findByIdAndUpdate(
            productId,
            updateProduct,
            {
                new: true,  // Return the modified document
                runValidators: true,  // Ensure validation rules are enforced
            }
        );

        if (!response) {
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log('Product updated successfully');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Delete Product details
router.delete('/',adminAuthMiddleware, async (req, res) =>{
    try {
        const productId = req.headers['id']; // Extract the id from the request headers
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required in headers' });
        }
        const response = await productModel.findByIdAndDelete(productId);
        if (!response) {
            return res.status(404).json({ message: 'Product not found' });
        }
        console.log(response);
        res.status(200).json({ message: 'Product Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Product count
router.get('/get/count', async (req, res) => {
    try {
        const productCount = await productModel.countDocuments();

        if (productCount === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        res.status(200).json({ productCount: productCount });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Featured Product http://localhost:8480/api/v1/products/get/featured/1
router.get('/get/featured/:count', async (req, res) => {
    try {
        const count = req.params.count ? req.params.count : 0;
        const products = await productModel.find({isFeatured:true}).limit(+count);

        if (!products) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        res.status(200).json({ products: products });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Product By Category
router.get('/filter', async (req, res) => {
    try {
        let filter = {};
        if (req.query.categories) {
            // Adjust the filter to match multiple categories
            filter = { category: { $in: req.query.categories.split(",") } };
        }

        const productList = await productModel.find(filter).populate('category');

        if (productList.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found for the given categories' });
        }

        res.status(200).json({ products: productList });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.put('/gallery/images/:id', uploadOptions.array('images', 10), adminAuthMiddleware, async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if the product exists
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Handle multiple images
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send('No images provided');
        }

        const basePath = `${req.protocol}://${req.get('host')}/public/uploads`;
        const imagePaths = files.map(file => `${basePath}/${file.filename}`);

        // Add the images to the product's gallery
        product.images.push(...imagePaths);
        const updatedProduct = await product.save();

        console.log('Images added to product gallery');
        res.status(200).json(updatedProduct);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
});



module.exports = router;