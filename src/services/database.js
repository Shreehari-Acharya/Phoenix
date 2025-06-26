import { prisma } from "../exports/prisma.js";
import { generateGadgetName } from "../utils/gadgetNameGenerator.js";
import crypto from "crypto";

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

/**
 * Creates a new gadget for a user.
 * Generates a unique gadget name and attempts to create the gadget in the database.
 * If the generated name already exists, it retries up to a maximum number of attempts.
 * @param {string} userId - The ID of the user for whom the gadget is being created.
 * @returns {Object} - The created gadget object with id, name, and status.
 * @throws {Error} - Throws an error if the gadget creation fails or if a unique name cannot be generated after multiple attempts.
 * @example 
 * // createGadget("user123")
 * // Returns the created gadget object or throws an error if the name is not unique after multiple attempts.
 */
export async function createGadget(userId) {
  const MAX_RETRIES = 5;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const gadgetName = generateGadgetName();

    try {
      const gadget = await prisma.gadget.create({
        data: {
          name: gadgetName,
          userId,
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });
      console.log(`New gadget created for ${userId} :`, gadgetName);
      return gadget;
    } catch (error) {
      
      if (error.code === 'P2002') {
        console.warn(`Name "${gadgetName}" already exists. Retrying...`);
        continue; 
      }

      console.error("Error creating gadget:", error);
      throw new Error("Internal server error");
    }
  }

  throw new Error("Failed to generate unique gadget name after multiple attempts");
}

/** * Fetches all gadgets for a user based on the specified type.
 * If type is 'ALL', it returns all gadgets with status 'AVAILABLE' or 'DEPLOYED'.
 * Otherwise, it returns gadgets with the specified status.
 * @param {string} type - The type of gadgets to fetch. Can be 'ALL' or a specific status like 'AVAILABLE', 'DEPLOYED'
 * @param {string} userId - The ID of the user whose gadgets are being fetched.
 * @returns {Array} - An array of gadget objects with id and name.
 * @throws {Error} - Throws an error if there is an issue fetching the gadgets.
 * @example
 * // getGadgets("AVAILABLE", "user123")
 * // Returns an array of gadget objects with id and name for the specified user and status.
 * // getGadgets("ALL", "user123")
 * // Returns all gadgets with status 'AVAILABLE' or 'DEPLOYED' for the specified user.
 */
export async function getGadgets(type = 'ALL', userId) {
  try {
    const gadgets = await prisma.gadget.findMany({
      where: {
        userId: userId,
        ...(type !== 'ALL' ? { status: type } : {status: { in: ['AVAILABLE', 'DEPLOYED'] }}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    return gadgets;
  } catch (error) {
      console.error("Error fetching gadgets:", error);
      throw new Error("Internal server error");
  }
}

/**
 * Updates the status of a gadget for a user.
 * Checks if the gadget exists and belongs to the user before updating its status.
 * @param {string} userId - The ID of the user who owns the gadget.
 * @param {string} gadgetId - The ID of the gadget to update.
 * @param {string} status - The new status to set for the gadget (e.g, 'AVAILABLE', 'DEPLOYED').
 * @returns {Object} - The updated gadget object with id, name, and status.
 * @throws {Error} - Throws an error if the gadget is not found, the user does not have permission to update it, or if there is an issue updating the gadget.
 * @example
 * // updateGadgetStatus("user123", "gadget456", "DEPLOYED")
 * // Returns the updated gadget object with id, name, and status or throws an error if the gadget is not found or the user does not have permission to update it.
 */
export async function updateGadgetStatus(userId, gadgetId, status) {
  try {
    const updatedGadget = await prisma.gadget.update({
      where: { userId: userId, id: gadgetId },
      data: { status },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return updatedGadget;
  } catch (error) {
    if(error.code === 'P2025') {
      // Record not found
      throw new Error("Gadget not found or you do not have permission to update it");
    }
    console.error("Error updating gadget status:", error);
    throw new Error("Internal server error");
  }
}

/**
 * Decommissions a gadget for a user.
 * Marks the gadget as decommissioned by setting the decommissionedAt timestamp and updating its status.
 * @param {string} userId - The ID of the user who owns the gadget.
 * @param {string} gadgetId - The ID of the gadget to decommission.
 * @returns {Object} - The decommissioned gadget object with id, name, and status.
 * @throws {Error} - Throws an error if the gadget is not found, the user does not have permission to decommission it, or if there is an issue updating the gadget.
 * @example
 * // decommissionGadget("user123", "gadget456")
 * // Returns the decommissioned gadget object with id, name, and status or throws an error if the gadget is not found or the user does not have permission to decommission it.
 */
export async function decommissionGadget(userId, gadgetId) {
  try {
    const deletedGadget = await prisma.gadget.update({
      where: { userId: userId, id: gadgetId },
      data:{
        decommissionedAt: new Date(),
        status: 'DECOMMISSIONED',
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    console.log(`Gadget with ID ${gadgetId} decommissioned for user ${userId}`);

    return deletedGadget;

  } catch (error) {
    if(error.code === 'P2025') {
      throw new Error("Gadget not found or you do not have permission to delete it");
    }
    console.error("Error deleting gadget:", error);
    throw new Error("Internal server error");
  }
}

/**
 * Initiates the self-destruct process for a gadget.
 * Generates a confirmation code and updates the gadget with this code. 
 * The confirmation code is a 6-character alphanumeric string.
 * @param {string} userId - The ID of the user who owns the gadget.
 * @param {string} gadgetId - The ID of the gadget to self-destruct.
 * @returns {Object} - The gadget object with id, name, and confirmation code.
 * @throws {Error} - Throws an error if the gadget is not found, the user does not have permission to self-destruct it, or if there is an issue updating the gadget.
 * @example
 * // initiateSelfDestruct("user123", "gadget456")
 * // Returns the gadget object with id, name, and confirmation code or throws an error if the gadget is not found or the user does not have permission to self-destruct it.
 */
export async function initiateSelfDestruct(userId, gadgetId) {
  try {
     const seftDestructDetails = await prisma.gadget.update({
      where: { userId: userId, id: gadgetId },
      data: {
        // Generate a 6-character confirmation code
        confirmationCode: crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z]/g, '').slice(0, 6), 
      },
      select: {
        id: true,
        name: true,
        confirmationCode: true,
      },
    });

    console.log(`Initiated self-destruct for Gadget ${gadgetId} of user ${userId}`);

    return seftDestructDetails;

  } catch (error) {
    if(error.code === 'P2025') {
      throw new Error("Gadget not found or you do not have permission to self-destruct it");
    }
    console.error("Error initiating self-destruct:", error);
    throw new Error("Internal server error");
  }
}

/**
 * Confirms the self-destruct process for a gadget.
 * Validates the confirmation code and updates the gadget status to 'DESTROYED'.
 * @param {string} userId - The ID of the user who owns the gadget.
 * @param {string} gadgetId - The ID of the gadget to self-destruct.
 * @param {string} confirmationCode - The confirmation code provided by the user to confirm self-destruct.
 * @returns {Object} - The gadget object with id, name, and status set to 'DESTROYED'.
 * @throws {Error} - Throws an error if the gadget is not found, the user does not have permission to self-destruct it, the confirmation code is invalid, or if there is an issue updating the gadget.
 * @example
 * // confirmSelfDestruct("user123", "gadget456", "abc123")
 * // Returns the gadget object with id, name, and status set to 'DESTROYED' or throws an error if the gadget is not found, the user does not have permission to self-destruct it, or the confirmation code is invalid.
 */
export async function confirmSelfDestruct(userId, gadgetId, confirmationCode) {
  try {
    const gadget = await prisma.gadget.findUnique({
      where: { userId: userId, id: gadgetId },
      select: {
        confirmationCode: true,
      },
    });

    if (!gadget) {
      throw new Error("Gadget not found or you do not have permission to self-destruct it");
    }

    if (gadget.confirmationCode !== confirmationCode) {
      throw new Error("Invalid confirmation code");
    }

    const deletedGadget = await prisma.gadget.update({
      where: { userId: userId, id: gadgetId },
      data: {
        status: 'DESTROYED',
        confirmationCode: null, 
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Gadget with ID ${gadgetId} self-destructed for user ${userId}`);

    return deletedGadget;

  } catch (error) {
    console.error("Error confirming self-destruct:", error);
    throw new Error("Internal server error");
  }
}