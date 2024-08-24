const express = require('express')
const app = express();
const cors = require('cors');
app.use(cors());
app.options('*',cors());
const db = require('./db');
require('dotenv').config();

const api = process.env.API_URL;

// set the response to json format
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const { authJwt } = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler')
// middleware
const morgan = require('morgan');
app.use(morgan('tiny'));
// app.use(authJwt());
app.use(errorHandler);
const path = require('path');
// Middleware to serve static files
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
const productsRoutes = require('./routes/productsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const usersRoutes = require('./routes/usersRoutes');
const orderRoutes = require('./routes/orderRoutes');



app.use(`${api}/products`,productsRoutes);
app.use(`${api}/category`,categoryRoutes);
app.use(`${api}/users`,usersRoutes);
app.use(`${api}/order`,orderRoutes);




// Get the audit details
// app.get(`${api}/products`, function (req, res) {
    // res.send('respond with a resource');
// });

// port defined
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})