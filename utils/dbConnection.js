const mongoose = require('mongoose');

const connectDB = async () => {
    // Check if mongoose already has an active connection
    if (mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        return;
    }

    // Check if we're currently connecting
    if (mongoose.connection.readyState === 2) {
        console.log('⏳ MongoDB connection in progress, waiting...');
        // Wait for the connection to be established with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection wait timeout'));
            }, 25000);
            
            mongoose.connection.once('connected', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            mongoose.connection.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        return;
    }

    try {
        const MONGO_URI = process.env.MONGO_URI;
        
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('🔄 Connecting to MongoDB...');
        
        const connectionOptions = {
            serverSelectionTimeoutMS: 25000, // 25 seconds (less than Vercel's 30s timeout)
            socketTimeoutMS: 45000,
            connectTimeoutMS: 25000,
            maxPoolSize: 10,
            minPoolSize: 2, // Keep minimum connections alive
            retryWrites: true,
            retryReads: true,
            heartbeatFrequencyMS: 10000, // Check connection health every 10s
        };

        await mongoose.connect(MONGO_URI, connectionOptions);

        console.log('✅ Connected to MongoDB Atlas');
        
        // Set up connection event handlers
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        console.error('❌ Error name:', error.name);
        if (error.code) {
            console.error('❌ Error code:', error.code);
        }
        
        // Clean up connection state on error
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect().catch(e => console.error('Error disconnecting:', e));
        }
        
        throw error;
    }
};

module.exports = connectDB;
