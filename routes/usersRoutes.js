var express = require('express');
var router = express.Router();
const usersModel = require('./../models/users');

// Auth
const passport = require('./../helpers/auth');
passport.use(passport.initialize());

// JWT
const { adminAuthMiddleware, userAuthMiddleware,generateToken} = require('./../helpers/jwt');



// Get the User details
router.get('/', async (req, res) => {
    try {
        const data = await usersModel.find().select('-password');
        // const data = await usersModel.find().select('name phone email');
        console.log('Users data recived');
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }
});

// Find user by Id
router.get('/:id', async (req, res) => {
    try {
        const user = await usersModel.findById(req.params.id).select('-password');;
        if (!user) {
            res.status(500).json({ message: 'The user with the given Id was not found' })
        }
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err });
    }

})

// Add new user
router.post('/register', async (req, res) => {
    try {
        const data = req.body; //Assuming request body contain the user data
        // Create a new user using model
        const newUser = new usersModel(data);
        const response = await newUser.save();
        console.log('Data Saved');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

// login
router.post('/login', async (req, res) => {
    try {
        // Extract email and password from request body
        const { email, password} = req.body;

        // Check if username or password is missing
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' })
        }
        // Find the user by email
        const user = await usersModel.findOne({ email: email });
        // If user does not exist or password does not match, return error
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }
        // generate Token 
        const payload = {
            email:user.email,
            // password:password,
            isAdmin:user.isAdmin
        }
        const token = generateToken(payload);
        // return token as response
        res.json({ token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }

})

// Update user details
router.put('/', async (req, res) => {
    try {
        const userId = req.headers['id']; // Extract the id from the request headers
        if (!userId) {
            return res.status(400).json({ message: 'user Id is required in headers' });
        }
        const updateuser = req.body;

        const response = await usersModel.findByIdAndUpdate(
            userId, updateuser, {
            new: true, //Purpose: This option specifies that the callback function should return the mo
            runValidators: true //Purpose: This option ensures that any validation rules defined in the
        }
        );
        if (!response) {
            return res.status(404).json({ message: 'user not found' });
        }
        console.log('Data Updated');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

// Delete loan details
router.delete('/',adminAuthMiddleware, async (req, res) => {
    try {
        const userId = req.headers['id']; // Extract the id from the request headers
        if (!userId) {
            return res.status(400).json({ message: 'user ID is required in headers' });
        }
        const response = await usersModel.findByIdAndDelete(userId);
        if (!response) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(response);
        res.status(200).json({ message: 'User Deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error', error: err });
    }
});

module.exports = router;