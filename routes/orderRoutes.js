var express = require('express');
var router = express.Router();
const orderModel = require('./../models/order');
const orderItemModel = require('./../models/order-item'); // Import Order Item model
const { adminAuthMiddleware, userAuthMiddleware } = require('./../helpers/jwt');

// Get the Order details
router.get('/', userAuthMiddleware, async (req, res) => {
    try {
        const orders = await orderModel.find()
            .populate('user', 'name') // Populate user details
            .populate({
                path: 'orderItems', // Populate orderItems field
                populate: {
                    path: 'product', // Populate product field within orderItems
                    select: 'name price' // Select relevant fields from Product schema
                }
            })
            .sort({ 'dateOrdered': -1 }); // Sort by dateOrdered in descending order

        console.log('Order data received');
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Get the Order details by id
router.get('/:id', userAuthMiddleware, async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id)
            .populate('user', 'name') // Populate user details
            .populate({
                path: 'orderItems', // Populate orderItems field
                populate: {
                    path: 'product', // Populate product field within orderItems
                    select: 'name price' // Select relevant fields from Product schema
                }
            })
            .sort({ 'dateOrdered': -1 }); // Sort by dateOrdered in descending order

        console.log('Order data received');
        res.status(200).json(order);
    } catch (err) {
        console.error('Error fetching order by id:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Add Order details
router.post('/', userAuthMiddleware, async (req, res) => {
    try {
        const {
            orderItems,
            shippingAdress1,
            shippingAdress2,
            city,
            zip,
            country,
            phone,
            user
        } = req.body;

        // Create OrderItems first and store their IDs
        const orderItemsIds = await Promise.all(orderItems.map(async orderItem => {
            let newOrderItem = new orderItemModel({
                quantity: orderItem.quantity,
                product: orderItem.product
            });
            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));

        // Calculate total price based on product prices and quantities
        const totalPrices = await Promise.all(orderItemsIds.map(async orderItemId => {
            const orderItem = await orderItemModel.findById(orderItemId).populate('product', 'price');

            // Check if the product exists
            if (orderItem && orderItem.product) {
                const totalPrice = orderItem.product.price * orderItem.quantity;
                return totalPrice;
            } else {
                return 0; // Handle the case where the product is null or not found
            }
        }));

        const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

        // Create the order
        let order = new orderModel({
            orderItems: orderItemsIds,
            shippingAdress1,
            shippingAdress2,
            city,
            zip,
            country,
            phone,
            user,
            totalPrice
        });

        order = await order.save();

        console.log('Order Saved');
        res.status(200).json(order);
    } catch (err) {
        console.log('Error saving order:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error', error: err.message });
    }
});


// Update Order details by id
router.put('/:id', userAuthMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        // Find and update the order status
        const updatedOrder = await orderModel.findByIdAndUpdate(
            req.params.id,
            { status }, // Update only the status field
            { new: true } // Return the updated document
        )
            .populate('user', 'name') // Populate user details
            .populate({
                path: 'orderItems', // Populate orderItems field
                populate: {
                    path: 'product', // Populate product field within orderItems
                    select: 'name price' // Select relevant fields from Product schema
                }
            });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order updated');
        res.status(200).json(updatedOrder);
    } catch (err) {
        console.error('Error updating order:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Delete Order by id
router.delete('/:id', userAuthMiddleware, async (req, res) => {
    try {
        // Find and delete the order
        const deletedOrder = await orderModel.findByIdAndDelete(req.params.id)
            .populate('user', 'name') // Populate user details
            .populate({
                path: 'orderItems', // Populate orderItems field
                populate: {
                    path: 'product', // Populate product field within orderItems
                    select: 'name price' // Select relevant fields from Product schema
                }
            });

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order deleted');
        res.status(200).json({ message: 'Order deleted' });
    } catch (err) {
        console.error('Error deleting order:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});


// Total Sales
router.get('/get/totalsales', userAuthMiddleware, async (req, res) => {
    try {
        const totalSales = await orderModel.aggregate([
            { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
        ]);

        // Check if totalSales array is not empty
        if (totalSales.length === 0) {
            return res.status(400).send('The order sales cannot be generated');
        }

        // Respond with the total sales
        res.send({ totalSales: totalSales[0].totalsales });
    } catch (err) {
        console.error('Error fetching total sales:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Order Count
router.get('/get/ordercount', userAuthMiddleware, async (req, res) => {
    try {
        const orderCount = await orderModel.countDocuments();

        // Check if orderCount is 0, indicating no orders
        if (orderCount === 0) {
            return res.status(500).json({ success: false });
        }

        res.send({ orderCount: orderCount });
    } catch (err) {
        console.error('Error fetching total orders:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});


// User orders
router.get('/get/userorders/:userid', userAuthMiddleware, async (req, res) => {
    try {
        const userOrderList = await orderModel.find({user:req.params.userid}).populate({
            path:'orderItems',populate:{
                path:'product',populate:'category'
            }
        }).sort({'dateOrdered':-1})

        if(!userOrderList){
            res.status(500).json({sucess:false});
        }
        res.send(userOrderList);

    } catch (err) {
        console.error('Error fetching total orders:', err.message, err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});



module.exports = router;
