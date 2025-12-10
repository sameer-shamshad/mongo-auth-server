import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const userSchema = new Schema(
    {
        username: { 
            type: String, 
            required: true, 
            trim: true,
        },
        email: { 
            type: String, 
            index: true,
            unique: true,
            required: true, 
            lowercase: true, 
        },
        password: { 
            type: String, 
            required: [true, 'Password is required.'],
        },
        refreshToken: { 
            type: String, 
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default models.User || model("User", userSchema);