
import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import EventEmitter from 'events';

const app = express();
const eventEmitter = new EventEmitter();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());

app.post('/config', async (req, res) => {
    const { userId, code } = req.body;

    eventEmitter.emit('config', code, userId);
    eventEmitter.once('reqConfig', data => {
        res.json({ ...data })

        console.log('data:', data)
        return;
    });

})

app.get('/print', (req, res) => {
    const { code, file } = req.body;

    eventEmitter.emit('print', code, file)
    eventEmitter.once('reqPrint', data => res.json({ ...data }));
})


io.on("connection", (socket) => {
    let id = '';

    socket.on('id', (socketId) => {
        console.log('connection', socketId)
        id = socketId
    });

    eventEmitter.on('config', (code, userId) => {
        try {
            socket.emit(code, userId)
        } catch (error) {
            console.log(error)
        }
    })

    eventEmitter.on('print', (socketId, url) => {
        socket.emit(`${socketId}/print`, url)
    })

    eventEmitter.on('config', (socketId, userId) => {
        socket.emit(`${socketId}/config`, userId)
        console.log(socket.id)
    })
    
    socket.on(`config`, configData => {
        console.log(id)
        eventEmitter.emit('reqConfig', configData)
    })

    socket.on(`print`, data => {
        console.log(data)
        eventEmitter.emit('reqPrint', data)
    })

    socket.on("disconnect", (reason) => {
        console.log('disconnect', id);
    })
});

httpServer.listen(5420);