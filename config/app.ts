import cors from "cors";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
// import { ALLOWED_ORIGINS } from "./env.config.js";

    
// Routes
import authRouter from "../routes/auth.route.js";

const app: Express = express();


// Middleware
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: "16kb" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({ 
    credentials: true,
    origin: "*",
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"]
}));

app.use("/api/auth", authRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    return res.status(500).send(err.message || "");
});

export default app;

