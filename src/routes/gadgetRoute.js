import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createNewGadget, deleteGadget, getAllGadgets, selfDestructGadget, updateGadget } from "../controllers/gadgetController.js";

const gadgetRouter = Router();

gadgetRouter.use(authMiddleware);

gadgetRouter.get("/", getAllGadgets);
gadgetRouter.post("/", createNewGadget);
gadgetRouter.patch("/", updateGadget);
gadgetRouter.delete("/", deleteGadget);
gadgetRouter.post("/:id/self-destruct", selfDestructGadget);


export default gadgetRouter;