import { Router } from "express";
import { registerUser, login, logout } from "../controllers/user.controller";

const router = Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", logout);

export default router;

