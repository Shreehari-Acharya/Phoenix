import { prisma } from "../exports/prisma.js";

/**
 * Creates a new user in the database.
 * Checks if the username is already taken before creating the user.
 * @param {string} username - The username of the new user.
 * @param {string} hashedPassword - The hashed password of the new user.
 * @returns {Object} - The created user object.
 * @throws {Error} - Throws an error if the username is already taken or if user creation fails.
 * @example 
 * // createUser("newuser", "hashedPassword123")
 * // Returns the created user object or throws an error if the username is taken.
 */
export async function createUser(username, hashedPassword) {
  try {

    const userPresent = await prisma.user.findUnique({
      where: { username },
    });
    if (userPresent) {
      throw new Error("username taken: " + username);
    }

    const user = await prisma.user.create({
      data: {
        username,
        hashPassword: hashedPassword,
      },
    });

    if (!user) {
      throw new Error("User creation failed");
    }
    console.log("new user created", username);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Internal server error");
  }
}

/**
 * Fetches a user by username from the database.
 * @param {string} username - The username of the user to fetch.
 * @returns {Object|null} - The user object if found, otherwise null.
 * @throws {Error} - Throws an error if there is an issue fetching the user.
 * @example
 * // getUserByUsername("existinguser")
 * // Returns the user object with id, username, and hashPassword if found, otherwise null
 */
export async function getUserByUsername(username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        hashPassword: true, 
      },
    });

    if (!user) {
      return null; // User not found
    }
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}