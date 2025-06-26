import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using JWT.
 * Checks for the presence of a JWT in the request cookies.
 * If the token is valid, it adds the user information to the request object.
 * If the token is missing or invalid, it returns a 401 Unauthorized response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} - Returns a 401 Unauthorized response if authentication fails. 
 * Otherwise, it calls the next middleware function.
*/
export async function authMiddleware(req, res, next) {
    const token = req.cookies?.auth;
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Authentication token is missing" 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        req.user.isAuthenticated = true; 
        next(); 
    } catch (error) {
        if( error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication token has expired. Please login again." 
            });
        }
        else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid authentication token. Please login again." 
            });
        }
        else {
            console.error("Authentication error:", error);
            return res.status(500).json({ 
                success: false, 
                message: "An error occurred during authentication. Please try again later." 
            });
        }
    }
}