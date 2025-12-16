import mongoose from 'mongoose';
import { DB_NAME, MONGODB_URI } from './env.config';

export const connectMongoDB = async () => {
  try {
    if (!MONGODB_URI)
      throw new Error('MONGODB_URI is not defined');

    if (!DB_NAME)
      throw new Error('DB_NAME is not defined');
  
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};