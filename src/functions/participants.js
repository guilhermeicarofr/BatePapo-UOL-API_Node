import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { db } from './mongo.js';
import { userSchema } from './../schemas/schemas.js';

dayjs.extend(utc);

async function getParticipants(req,res) {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.status(200).send(participants);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

async function loginUser(req,res) {
    const time = dayjs().format('HH:mm:ss');
    const { name } = req.body;
    
    const validation = userSchema.validate({ name });
    if(validation.error) {
        console.log(validation.error);
        return res.sendStatus(422);
    }
    const checkuser = await checkOnline(name);
    if(checkuser) {
        return res.sendStatus(409);
    }

    try {
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
}

async function stayOnline(req,res) {
    const { user } = req.headers;

    const checkuser = await checkOnline(user);
    if(!checkuser) {
        return res.sendStatus(404);
    }

    try {
        await db.collection('participants').updateOne(
            {_id:checkuser._id},
            { $set:{ ...checkuser, lastStatus: Date.now()} }
        );
        res.sendStatus(200);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

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
    } catch(error) {
        console.log(error);
    }
}

async function checkOnline(name) {
    const checkuser = await db.collection('participants').findOne({name: name});
    return checkuser;
}

export { getParticipants, loginUser, stayOnline, onlineMonitor, checkOnline };