import express from 'express';
import cors from 'cors';

import { getMessages, postMessage, deleteMessage, editMessage } from './functions/messages.js';
import { loginUser, getParticipants, stayOnline, onlineMonitor } from './functions/participants.js';

const server = express();
server.use(cors());
server.use(express.json());


server.get('/participants', getParticipants);
server.post('/participants', loginUser);
server.post('/status', stayOnline);

server.get('/messages', getMessages);
server.post('/messages', postMessage);
server.delete('/messages/:id', deleteMessage);
server.put('/messages/:id', editMessage);

setInterval(onlineMonitor,15000);
server.listen(5000,()=>console.log('Server listening on port 5000...'));