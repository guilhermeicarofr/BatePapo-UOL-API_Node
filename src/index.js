import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dotenv.config();
dayjs.extend(utc);

const server = express();
server.use(cors());
server.use(express.json());

const mongo = new MongoClient(process.env.MONGO_URI)
let db;
mongo.connect().then(() => {
    db = mongo.db('uol');
    console.log('Connected to Database');
});







const userSchema = joi.object({
    name: joi.string().required()
});

server.post('/participants', async (req,res) => {

    const time = dayjs().format('HH:mm:ss');

    const { name } = req.body;
    
    const validation = userSchema.validate({ name });

    if(validation.error) {
        console.log(validation.error);
        return res.sendStatus(422); //melhorar messages
    }
    
    try {
        const checkuser = await db.collection('participants').findOne({name: name});
        if(checkuser) {
            return res.sendStatus(409);
        }
        await db.collection('participants').insertOne({name: name, lastStatus: Date.now()});
        res.sendStatus(201);      

        await db.collection('messages').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: time
        });

    } catch(error) {
        console.log(error);
        res.send(500);
    }
});





server.listen(5000,()=>console.log('Server listening on port 5000...'))