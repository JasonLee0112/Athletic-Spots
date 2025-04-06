import mongoose from "mongoose";

// Only for development
// TODO: Remove this piece of code
import * as dotenv from "dotenv";
dotenv.config();

// Tracks connection state and makes sure there aren't multiple connections to the database
interface DatabaseConnection {
    isConnected: boolean;
    isConnecting: boolean;
}

const connectionString = process.env.MONGODB_URI!;
const connection: DatabaseConnection= {
    isConnected : false,
    isConnecting : false,
};


export async function connectToDatabase(): Promise<typeof mongoose> {
    console.log("Connecting to Database");
    if(connection.isConnected){
        console.log("Already connected!")
        return mongoose;
    }

    console.log("Checking if still connecting");
    if(connection.isConnecting){
        let attempts = 0;
        const maxAttempts = 50;

        while(connection.isConnecting && attempts < maxAttempts){
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        
        if(connection.isConnected) {
            return mongoose;
        }

        if(connection.isConnecting) {
            throw new Error('Database connection timeout');
        }
    }


    try {
        connection.isConnecting = true;
        
        if(mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        console.log("Attempting to connect")
        await mongoose.connect(connectionString);
        console.log('Connected to MongoDB');
        return mongoose;
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        throw error;
    } finally {
        connection.isConnecting = false;
    }
}

// Ensure the database connection is closed when the application shuts down
process.on('SIGINT', async () => {
    try {
        if(mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('MongoDB connection closed');
        }
    } catch (error) {
        console.error('Error during MongoDB disconnection', error);
    } finally {
        process.exit(0);
    }
}); 

// Initialize the connection
connectToDatabase().catch(console.error);