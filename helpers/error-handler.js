function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        // Handle JWT authorization errors
        res.status(401).json({ message: "The user is not authorized" });
    } else if (err.name === 'ValidationError') {
        // Handle Mongoose validation errors
        res.status(401).json({ message: err.message });
    } else {
        // Handle any other server errors
        res.status(500).json({ message: "An internal server error occurred", error: err.message });
    }
}

module.exports = errorHandler;
