import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { registerUser } from "../controllers/user.controller.js";

const router = new Router();

router.post("/", verifyToken, registerUser);

export default router;