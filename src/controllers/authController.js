import { createUser, getUserByUsername } from "../services/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Registers a new user with the provided username and password.
 * Hashes the password before storing it in the database.
 * @param {Object} req - The request object containing the username and password.
 * @param {Object} res - The response object used to send the response.
 * @returns {Object} - { success: boolean, message: string }
 * @example
 * // POST /api/auth/register
 * {
 *   "username": "newuser",
 *  "password": "securepassword"
 * }
 */
export async function register(req, res){
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        const user = await createUser(username, hashedPassword);
        return res.status(201).json({ 
            success: true,
            message: "User registered successfully. Please login to continue"
        });
    } catch (error) {

        console.error("Registration error:", error);

        return res.status(500).json({ 
            success: false,
            error: error.message || "An error occurred during registration. Please try again later."
        });
    }
}

/**
 * Logs in a user with the provided username and password.
 * Generates a JWT token if the credentials are valid.
 * @param {Object} req - The request object containing the username and password.
 * @param {Object} res - The response object used to send the response.
 * @returns {Object} - { success: boolean, message: string }
 * @example
 * // POST /api/auth/login
 * {
 *   "username": "existinguser",    
 *   "password": "userpassword"
 * }
 */
export async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const user = await getUserByUsername(username);

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid username or password. Try Again" });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.hashPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid username or password" 
            });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.cookie("auth", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        return res.status(200).json({ 
            success: true,
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            success: false,
            error: "An error occurred during login. Please try again later."
        });
    }
}