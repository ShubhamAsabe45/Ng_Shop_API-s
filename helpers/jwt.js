const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt');
const api = process.env.API_URL;

// Middleware to verify JWT and set user information
const jwtAuthMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).json({ error: 'Token Not Found' });

    const token = authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Set admin status based on the token
        req.isAdmin = req.user.isAdmin || false;

        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to allow access only for admins
const adminAuthMiddleware = (req, res, next) => {
    jwtAuthMiddleware(req, res, () => {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        next();
    });
};

// Middleware to allow access for authenticated users (including admins)
const userAuthMiddleware = (req, res, next) => {
    jwtAuthMiddleware(req, res, next);
};

// Function to generate a JWT token
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET);
};

// Protection JWT Middleware
function authJwt() {
    const secret = process.env.JWT_SECRET;
    return jwtMiddleware({
        secret,
        algorithms: ['HS256']
    })
    .unless({
        path: [
            // Public routes that don't require authentication
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/category(.*)/, methods: ['GET', 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,
        ]
    });
}

module.exports = { jwtAuthMiddleware, adminAuthMiddleware, userAuthMiddleware, generateToken, authJwt };
