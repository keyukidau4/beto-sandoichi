import mongoose from 'mongoose';
import { config } from './environment';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    
    console.log(`MongoDB connected successfully to: ${config.database.uri.split('@')[1] || 'localhost'}`);
    console.log(`Database environment: ${config.nodeEnv}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;