import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { db } from './mongo.js';
import { messageSchema } from './../schemas/schemas.js';
import { checkOnline } from './participants.js';

dayjs.extend(utc);

async function postMessage(req,res) {
    const time = dayjs().format('HH:mm:ss');
    const { to, text, type } = req.body;
    const { user } = req.headers;
    let from = '';

    const checkuser = await checkOnline(user);
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
    }, { abortEarly: false });
    if(validation.error) {
        console.log(validation.error)
        return res.sendStatus(422);
    }

    try {
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
}

async function getMessages(req,res) {
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
}

export { postMessage, getMessages };