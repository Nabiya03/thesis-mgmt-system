const mongoose = require('mongoose');
const logger = require('../app/loggers/winston.logger');
const loadModels = require('../app/models'); // Explicit imports

module.exports = async (DBURL) => {
  const DB_URI =
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI;

  try {
    await mongoose.connect(DBURL || DB_URI, {
      maxPoolSize: 250, // Optimized for STMS
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    logger.info('MongoDB connected successfully');

    loadModels(); // Loads models explicitly

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed on app termination');
      process.exit(0);
    });
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};