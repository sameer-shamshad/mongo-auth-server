import redis from "../config/redis.config.js";
import User from "../models/User.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        return { accessToken: null, refreshToken: null };
    }
}

export async function registerUser(req, res) {
    try {
        const { username, email, password = "", idemKey } = req.body;

        if (!idemKey) {
            return res.status(400).json({
                type: "warning",
                message: "An idempotancy key is required to proceed the request.",
            });
        }

        const cached = await redis.get(idemKey);

        if (cached) {
            const { status, body } = JSON.parse(cached);
            return res.status(status).json({ ...body, message: `Dear ${username}! your account has already been created with the email: ${email}` });
        }

        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                type: "warning",
                message: "All fields are required.",
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                type: "warning",
                message: "The password must be of 7 charcaters long.",
            });
        }
        
        const existedUser = await User.findOne({ email: email.trim().toLowerCase() });
        
        if (existedUser) {
            return res.status(404).json({
                type: "error",
                message: "User with this email already exists.",
            });   
        }
        
        const user = await User.create({ 
            username: username.trim(), 
            email: email.trim().toLowerCase(), 
            password,
        });
        
        if (!user) {
            return res.status(500).json({
                type: "error",
                message: "Something went wrong while registering the user",
            });
        }

        const response = { type: "success", message: "Account created successfully!" };
        const status = 200;

        await redis.set(idemKey, JSON.stringify({ status, body: response }), "EX", 3600);

        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({ 
            type: "error",
            message: `Internal server error!`
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password = "" } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                type: "warning",
                message: "All fields are required.",
            });
        }

        const key = `login:attempts:${email}`;
        const attempts = await redis.incr(key);

        if (attempts === 1) await redis.expire(key, 300); // expire after 5 mins
        if (attempts > 5) {
            return res.status(429).json({ 
                type: "error", 
                message: "Too many login attempts. Try later." 
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                type: "error",
                message: "User not found!",
            });   
        }
        
        const isPasswordValid = await user.isPasswordCorrect(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                type: "error",
                message: "The user name or password is incorrect.",
            });
        }
        
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        
        if (!accessToken || !refreshToken) {
            return res.status(500).json({
                type: "error",
                message: "An error occured while generating tokens.",
            });
        }

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        const status = 200;
        const response = { 
            type: "success", 
            user: loggedInUser,
            message: "User logged in successfully.",
        };

        await redis.del(key); // delete login attempts key.

        const sessionKey = `session:${loggedInUser._id}`;
        const sessionTokens = { accessToken, refreshToken };

        await redis.set(sessionKey, JSON.stringify(sessionTokens), "EX", 60*60*24); // 1 day

        return res.status(status)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(response);
    } catch (error) {
        return res.status(500).json({ 
            type: "error",
            message: `Internal server error!`
        });
    }
}

export async function logout(req, res) {
    try {
        const userId = req?.user._id;
    
        if (!userId) {
            return res.status(400).json({
                type: "error",
                message: "The user is not authenticated.",
            });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: { refreshToken: null } },
            { new: true, },
        )

        if (!user) {
            return res.status(404).json({
                type: "error",
                message: "User not found!",
            });
        }

        await redis.del(`session:${userId}`);
    
        return res.status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json({ 
                type: "success",
                message: "You have been logged out successfully.",
            });
    } catch (error) {
        return res.status(500).json({ 
            type: "error",
            message: `Internal server error!`
        });
    }
}