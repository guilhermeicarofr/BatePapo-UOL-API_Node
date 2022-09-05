import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongo = new MongoClient(process.env.MONGO_URI)
let db;
mongo.connect().then(() => {
    db = mongo.db('uol');
    console.log('Connected to Database');
});

export { db };