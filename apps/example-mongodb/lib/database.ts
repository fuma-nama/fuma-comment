import { MongoClient } from "mongodb";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new MongoClient(url);
export const db = client.db();
