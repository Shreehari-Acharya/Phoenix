import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const gadgetRouter = Router();

gadgetRouter.use(authMiddleware);

gadgetRouter.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Gadget route accessed successfully",
        user: req.user
    });
});

export default gadgetRouter;