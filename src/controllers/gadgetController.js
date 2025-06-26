import { confirmSelfDestruct, createGadget, decommissionGadget, getGadgets, initiateSelfDestruct, updateGadgetStatus } from "../services/database.js";

/**
 * Creates a new gadget for the authenticated user.
 * @param {Object} req - The request object containing user information.
 * @param {Object} res - The response object to send the result.
 * @returns {Object} - A JSON response indicating success or failure.
 * @example
 * // POST /gadgets
 * // Creates a new gadget for the authenticated user and returns the gadget details.
 * // Response: { success: true, message: "Gadget created successfully", gadget: { id, name, status, createdAt } }
 */
export async function createNewGadget(req, res) {
    try {
        const userId = req.user.userId; 
        const gadget = await createGadget(userId);

        return res.status(201).json({
            success: true,
            message: "Gadget created successfully",
            gadget
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "An error occurred while creating the gadget. Please try again later."
        });
    }
}

/**
 * Fetches all gadgets for the authenticated user, optionally filtered by status.
 * @param {Object} req - The request object containing query parameters and user information.
 * @param {Object} res - The response object to send the result.
 * @returns {Object} - A JSON response containing the list of gadgets and their success probabilities.
 * @example
 * // GET /gadgets?status=available
 * // Fetches all gadgets of type 'available' for the authenticated user and returns their names
 * // and a random success probability.
 * // Response: 
 * { success: true, 
 *   message: "Gadgets of type AVAILABLE fetched successfully", 
 *   gadgets: ["Gadget1 - 75% success probability", "Gadget2 - 50% success probability"]
 * }
 * @example
 * // GET /gadgets
 * // Fetches all gadgets for the authenticated user and returns their names and a random success probability
 * // Response:
 * { success: true,
 *   message: "All gadgets fetched successfully",
 *   gadgets: ["Gadget1 - 75% success probability", "Gadget2 - 50% success probability"]
 * }
 */
export async function getAllGadgets(req, res) {
    const { status } = req.query ? req.query : {};
    const userId = req.user.userId;

    if (status) {
        const allowed = ['available', 'deployed'];
        if (allowed.includes(status.toLowerCase())) {
            const type = status.toUpperCase();
            try {
                const gadgets = await getGadgets(type, userId);
                const data = [];

                for (const gadget of gadgets) {
                    data.push(`${gadget.name} - ${Math.floor(Math.random() * 100) + 1}% success probability`);
                }
                return res.json({
                    success: true,
                    message: `Gadgets of type ${type} fetched successfully`,
                    gadgets: data,
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message || "An error occurred while fetching the gadgets. Please try again later."
                });

            }
        }
    }
    try {
        const gadgets = await getGadgets('ALL', userId);
        const data = [];

        for (const gadget of gadgets) {
            data.push(`${gadget.name} - ${Math.floor(Math.random() * 100) + 1}% success probability`);
        }
        return res.json({
            success: true,
            message: "All gadgets fetched successfully",
            gadgets: data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "An error occurred while fetching the gadgets. Please try again later."
        });
    }

}

/**
 * Updates the status of a gadget for the authenticated user.
 * @param {Object} req - The request object containing gadget ID, new status, and user information.
 * @param {Object} res - The response object to send the result.
 * @returns {Object} - A JSON response indicating success or failure.
 * @example
 * // PATCH /gadgets
 * // Updates the status of a gadget with ID '12345' to 'available' for the authenticated user.
 * // Response: { success: true, message: "Gadget status updated successfully", gadget: { id, name, status, updatedAt } }
 * @example
 * // PATCH /gadgets
 * // Updates the status of a gadget with ID '12345' to 'deployed'
 * // Response: { success: true, message: "Gadget status updated successfully", gadget: { id, name, status, updatedAt } }
 */
export async function updateGadget(req, res){
    const allowedStatuses = ['available', 'deployed']; // only 2, 'decommissioned' & 'destroyed' are only allowed in delete and seft-destruct routes
    try {
        const { gadgetId, status } = req.body || {};
        const { userId } = req.user;

        if (!gadgetId || !status) {
            return res.status(400).json({
                success: false,
                message: "Gadget ID and status are required"
            });
        }

        
        if (!allowedStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed statuses are: available & deployed"
            });
        }

        const updatedGadget = await updateGadgetStatus(userId, gadgetId, status.toUpperCase());
        return res.status(200).json({
            success: true,
            message: "Gadget status updated successfully",
            gadget: updatedGadget
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * Deletes a gadget for the authenticated user.
 * @param {Object} req - The request object containing gadget ID and user information.
 * @param {Object} res - The response object to send the result.
 * @returns {Object} - A JSON response indicating success or failure.
 * @example
 * // DELETE /gadgets?gadgetId=12345
 * // Deletes a gadget with ID '12345' for the authenticated user.
 * // Response: { success: true, message: "Gadget deleted successfully", gadget: { id, name, status, decommissionedAt } }
 * @example
 * // DELETE /gadgets?gadgetId=67890
 * // Deletes a gadget with ID '67890' for the authenticated user.
 * // Response: { success: true, message: "Gadget deleted successfully", gadget: { id, name, status, decommissionedAt } }
 */
export async function deleteGadget(req, res) {
    const { gadgetId } = req.query || {};
    const { userId } = req.user;

    if(!gadgetId) {
        return res.status(400).json({
            success: false,
            message: "Gadget ID is required"
        });
    }

    try {
        const deletedGadget = await decommissionGadget(userId, gadgetId);
    
        return res.status(200).json({
            success: true,
            message: "Gadget deleted successfully",
            gadget: deletedGadget
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "An error occurred while decommissioning the gadget. Please try again later."
        });
    }
}

/**
 * Initiates or confirms the self-destruct sequence for a gadget.
 * If no confirm code is provided, it initiates the self-destruct sequence and returns a confirmation code.
 * If a confirm code is provided, it confirms the self-destruct sequence and deletes the gadget.
 * @param {Object} req - The request object containing gadget ID, confirm code, and user information.
 * @param {Object} res - The response object to send the result.
 * @returns {Object} - A JSON response indicating success or failure.
 * @example
 * // POST /gadgets/:id/self-destruct
 * // Initiates the self-destruct sequence for a gadget with ID '12345'.
 * // Response: { success: true, message: "Hit the endpoint again with confirm code to self-destruct the gadget.", confirmCode: "abc123" }
 * @example
 * // POST /gadgets/:id/self-destruct
 * // Confirms the self-destruct sequence for a gadget with ID '12345' using confirm code 'abc123'.
 * // Response: { success: true, message: "Gadget self-destructed successfully", gadget: { id, name, status, destroyedAt } }
 */
export async function selfDestructGadget(req, res) {
    const { id } = req.params;
    const { confirmCode } = req.body || {};
    const { userId } = req.user;

    if(!id) {
        return res.status(400).json({
            success: false,
            message: "Gadget ID is required"
        });
    }

    if(!confirmCode) {
        try {
            const initiateDestruct = await initiateSelfDestruct(userId, id);
            return res.status(200).json({
                success: true,
                message: "Hit the endpoint again with confirm code to self-destruct the gadget.",
                confirmCode: initiateDestruct.confirmationCode
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || "An error occurred while initiating self-destruct. Please try again later."
            });
        }
    }
    else{
        try {
            const deletedGadget = await confirmSelfDestruct(userId, id, confirmCode);
            return res.status(200).json({
                success: true,
                message: "Gadget self-destructed successfully",
                gadget: deletedGadget
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || "An error occurred while confirming self-destruct. Please try again later."
            });
        }
    }
}


