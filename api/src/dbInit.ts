import { MongoClient } from "mongodb";
import dotenv from "dotenv"

dotenv.config({
    path: "../.env",
  });

  const environment = process.env.NODE_ENV;
  // Initialize MongoDB
  const uri = environment=="development"? process.env.DEV_ATLAS_URI : process.env.PROD_ATLAS_URI;
  if(!uri) {
    throw new Error("Cannot find ATLAS_URI in .env");
  }
const client = new MongoClient(uri);

// Connect to Cluster
const connectToDB = async () => {
    try {
      await client.connect();
      console.log(`Connected to the cluster`);
    } catch (err) {
      console.error(`Error connecting to the cluster: ${err}`);
    }
  };

connectToDB();

// Export db reference for routes files
export const social_db = environment=="development"? client.db("dev_social_data") : client.db("social_data");