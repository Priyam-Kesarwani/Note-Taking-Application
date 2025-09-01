import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI as string;

if (!mongoURI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

const connectDB = async (): Promise<void> => {
  try {
     await mongoose.connect(mongoURI, {
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the app if DB connection fails
  }
};

export default connectDB;
