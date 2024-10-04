var express = require('express');
var router = express.Router();
const orderModel = require('./../models/order');
const orderItemModel = require('./../models/order-item');
const { adminAuthMiddleware, userAuthMiddleware } = require('./../helpers/jwt');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.get('/', userAuthMiddleware, async (req, res) => {
    try {
        const orders = await orderModel.find()
            .populate('user', 'name')
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name price' }
            })
            .sort({ 'dateOrdered': -1 });

        console.log('Order data received');
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the order to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', userAuthMiddleware, async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id)
            .populate('user', 'name')
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name price' }
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error('Error fetching order by id:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Add a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.post('/', userAuthMiddleware, async (req, res) => {
    try {
        const { orderItems, shippingAdress1, shippingAdress2, city, zip, country, phone, user } = req.body;
        
        const orderItemsIds = await Promise.all(orderItems.map(async item => {
            let newOrderItem = new orderItemModel({ quantity: item.quantity, product: item.product });
            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));

        const totalPrices = await Promise.all(orderItemsIds.map(async id => {
            const item = await orderItemModel.findById(id).populate('product', 'price');
            return item.product ? item.product.price * item.quantity : 0;
        }));

        const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

        let order = new orderModel({ orderItems: orderItemsIds, shippingAdress1, shippingAdress2, city, zip, country, phone, user, totalPrice });
        order = await order.save();

        console.log('Order saved');
        res.status(200).json(order);
    } catch (err) {
        console.error('Error saving order:', err.message);
        res.status(500).json({ error: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   put:
 *     summary: Update order status by ID
 *     tags: [Orders]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the order to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated order
 *       404:
 *         description: Order not found
 */
router.put('/:id', userAuthMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await orderModel.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate('user', 'name')
            .populate({ path: 'orderItems', populate: { path: 'product', select: 'name price' } });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order updated');
        res.status(200).json(updatedOrder);
    } catch (err) {
        console.error('Error updating order:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   delete:
 *     summary: Delete order by ID
 *     tags: [Orders]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the order to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
router.delete('/:id', userAuthMiddleware, async (req, res) => {
    try {
        const deletedOrder = await orderModel.findByIdAndDelete(req.params.id)
            .populate('user', 'name')
            .populate({ path: 'orderItems', populate: { path: 'product', select: 'name price' } });

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order deleted');
        res.status(200).json({ message: 'Order deleted' });
    } catch (err) {
        console.error('Error deleting order:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/get/totalsales:
 *   get:
 *     summary: Get total sales
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Total sales amount
 *       500:
 *         description: Internal server error
 */
router.get('/get/totalsales', userAuthMiddleware, async (req, res) => {
    try {
        const totalSales = await orderModel.aggregate([{ $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }]);

        if (!totalSales.length) {
            return res.status(400).send('The order sales cannot be generated');
        }

        res.send({ totalSales: totalSales[0].totalsales });
    } catch (err) {
        console.error('Error fetching total sales:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/get/ordercount:
 *   get:
 *     summary: Get order count
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Total number of orders
 *       500:
 *         description: Internal server error
 */
router.get('/get/ordercount', userAuthMiddleware, async (req, res) => {
    try {
        const orderCount = await orderModel.countDocuments();

        if (!orderCount) {
            return res.status(500).json({ success: false });
        }

        res.send({ orderCount });
    } catch (err) {
        console.error('Error fetching order count:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/**
 * @swagger
 * /order/get/userorders/{userid}:
 *   get:
 *     summary: Get orders for a specific user
 *     tags: [Orders]
 *     parameters:
 *       - name: userid
 *         in: path
 *         required: true
 *         description: User ID to fetch orders
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user orders
 *       404:
 *         description: User orders not found
 *       500:
 *         description: Internal server error
 */
router.get('/get/userorders/:userid', userAuthMiddleware, async (req, res) => {
    try {
        const userOrders = await orderModel.find({ user: req.params.userid })
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name price' }
            })
            .sort({ 'dateOrdered': -1 });

        if (!userOrders) {
            return res.status(404).json({ message: 'User orders not found' });
        }

        res.status(200).json(userOrders);
    } catch (err) {
        console.error('Error fetching user orders:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
