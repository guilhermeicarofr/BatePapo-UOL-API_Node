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



//separar index em app e outros arquivos(schemas, mongo, etc)
//reaproveitar funcao de check se user online
//melhorar codigos de erro e messages

//Bonus - Sanitizar os dados de post user e message
//Bonus - Apagar mensagem
//Bonus - Editar mensagem

const userSchema = joi.object({
    name: joi.string().required()
});

server.post('/participants', async (req,res) => {
    const time = dayjs().format('HH:mm:ss');
    const { name } = req.body;
    
    const validation = userSchema.validate({ name });
    if(validation.error) {
        console.log(validation.error);
        return res.sendStatus(422);
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
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.get('/messages', async (req,res) => {
    const { user } = req.headers;
    const { limit } = (req.query);

    const messagelimit = ((limit === undefined || isNaN(limit)) ? 0 : Number(limit));

    try {
        const messages = await db.collection('messages').find({
            $or: [
                {to: {$in:['Todos',user]}},
                {from: user}
            ]
        }).toArray();
        res.status(200).send(messages.splice(-messagelimit));
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});



server.post('/status', async (req,res) => {
    const { user } = req.headers;

    try {
        const checkuser = await db.collection('participants').findOne({name: user});
        if(!checkuser) {
            return res.sendStatus(404);
        }

        await db.collection('participants').updateOne(
            {_id:checkuser._id},
            { $set:{ ...checkuser, lastStatus: Date.now()} }
        );
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

async function onlineMonitor() {
    try {
        const participants = await db.collection('participants').find().toArray();

        const offline = participants.filter((user) => Date.now() - user.lastStatus > 10000);
        console.log(`Clearing ${offline.length} offline users`);

        offline.forEach(async (user) => {
            const time = dayjs().format('HH:mm:ss');
            await db.collection('participants').deleteOne({_id: user._id});
            await db.collection('messages').insertOne({
                from: user.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: time
            });
        });
    } catch (error) {
        console.log(error);
    }
}

setInterval(onlineMonitor,15000);
server.listen(5000,()=>console.log('Server listening on port 5000...'))