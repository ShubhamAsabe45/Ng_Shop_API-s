var express = require('express');
var router = express.Router();
const usersModel = require('./../models/users');
const { adminAuthMiddleware, userAuthMiddleware, generateToken } = require('./../helpers/jwt');
const passport = require('./../helpers/auth');
passport.use(passport.initialize());

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API to manage user accounts.
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of all users.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users excluding passwords.
 *       500:
 *         description: Internal server error.
 */
router.get('/', async (req, res) => {
    try {
        const data = await usersModel.find().select('-password');
        console.log('Users data received');
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Retrieve user details by ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID.
 *     responses:
 *       200:
 *         description: User details excluding the password.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await usersModel.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'The user with the given ID was not found' });
        }
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully.
 *       500:
 *         description: Internal server error.
 */
router.post('/register', async (req, res) => {
    try {
        const newUser = new usersModel(req.body);
        const response = await newUser.save();
        console.log('Data Saved');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login a user and generate a JWT token.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully and token is returned.
 *       400:
 *         description: Email and password are required.
 *       401:
 *         description: Invalid email or password.
 *       500:
 *         description: Internal server error.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await usersModel.findOne({ email: email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }
        const payload = { email: user.email, isAdmin: user.isAdmin };
        const token = generateToken(payload);
        res.json({ token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

/**
 * @swagger
 * /api/v1/users:
 *   put:
 *     summary: Update user details by ID in headers.
 *     tags: [Users]
 *     parameters:
 *       - in: header
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully.
 *       400:
 *         description: User ID is required in headers.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/', async (req, res) => {
    try {
        const userId = req.headers['id'];
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required in headers' });
        }
        const response = await usersModel.findByIdAndUpdate(userId, req.body, {
            new: true,
            runValidators: true
        });
        if (!response) {
            return res.status(404).json({ message: 'User not found' });
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
 * /api/v1/users:
 *   delete:
 *     summary: Delete a user by ID in headers.
 *     tags: [Users]
 *     parameters:
 *       - in: header
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to delete.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       400:
 *         description: User ID is required in headers.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/', adminAuthMiddleware, async (req, res) => {
    try {
        const userId = req.headers['id'];
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required in headers' });
        }
        const response = await usersModel.findByIdAndDelete(userId);
        if (!response) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User Deleted');
        res.status(200).json({ message: 'User Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

module.exports = router;
