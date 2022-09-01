import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongo = new MongoClient(process.env.MONGO_URI)
let db;
mongo.connect().then(()=> {
    db = mongo.db('uol');
    console.log('Connected to Database');
});




























server.listen(5000,()=>console.log('Server listening on port 5000...'))