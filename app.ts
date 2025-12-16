import { PORT } from './config/env.config.js';
import bodyParser from 'body-parser';
import express, { type Express } from 'express';
import cors from 'cors';

import { connectMongoDB } from './config/mongo.config.js';
import authRoutes from './routes/auth.route.js';

const app: Express = express();

connectMongoDB(); // Connect to MongoDB

app.use(cors({
  origin: '*',
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

export default app;

