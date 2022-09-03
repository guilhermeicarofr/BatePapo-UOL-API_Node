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

        await db.collection('messages').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: time
        });
        res.sendStatus(201); 
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.get('/participants', async (req,res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.status(200).send(participants);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});






const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message','private_message').required()
});

server.post('/messages', async (req,res) => {

    const time = dayjs().format('HH:mm:ss');
    const { to, text, type } = req.body;
    let from = '';

    try {
        const checkuser = await db.collection('participants').findOne({name: req.headers.user});
        if(checkuser) {
            from = checkuser.name;
        } else {
            return res.sendStatus(422);
        }

        const validation = messageSchema.validate({
            from,
            to,
            text,
            type
        });
        if(validation.error) {
            console.log(validation.error)
            return res.sendStatus(422);
        }

        await db.collection('messages').insertOne({
            from,
            to,
            text,
            type,
            time
        });
        res.statusCode(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});



server.listen(5000,()=>console.log('Server listening on port 5000...'))