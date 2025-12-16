import { Request, Response } from "express";
import User from "../models/user.model.js";

interface RegisterRequestBody {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, username, password, confirmPassword }: RegisterRequestBody = req.body;

    // Validate all fields are provided
    if (!username?.trim() || !email?.trim() || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate password length
    if (password.length < 7) {
      return res.status(400).json({ message: "The password must be at least 7 characters long." });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if user already exists
    const existedUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existedUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Create new user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (!user) {
      return res.status(500).json({ message: "Something went wrong while registering the user" });
    }

    return res.status(200).json({ message: "Account created successfully!" });
  } catch (error: unknown) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error!",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {}
export const logout = async (req: Request, res: Response): Promise<void> => {}
