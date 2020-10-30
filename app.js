const express = require('express')
const fs = require('fs')
const https = require('https')
//const ejs = require('ejs')
//const { v4: uuidv4 } = require('uuid')

const port = 7001;
//let clients = [];

const options = {
    key: fs.readFileSync('./keys/key.pem'),
    cert: fs.readFileSync('./keys/cert.pem')
};

const app = express();
app.set('view engine', 'html');


const server = https.createServer(options, app);
server.listen(port, () => console.log(`Server listens on port: ${port}`));

const io = require('socket.io').listen(server);


io.on("connection", socket => {

    console.log(`Client with id ${socket.id} connected`);

    // socket.on("join", (roomId, userId) => {
    //     console.log(roomId, userId);
    //     socket.join(roomId);
    //     socket.broadcast.emit('user-connected', userId);
    // })


    socket.on('join', (roomId) => {
        const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
        const numberOfClients = roomClients.length

        // These events are emitted only to the sender socket.
        if (numberOfClients == 0) {
            console.log(`Creating room ${roomId} and emitting room_created socket event`)
            socket.join(roomId)
            socket.emit('room_created', roomId)
        } else if (numberOfClients == 1) {
            console.log(`Joining room ${roomId} and emitting room_joined socket event`)
            socket.join(roomId)
            socket.emit('room_joined', roomId)
        } else {
            console.log(`Can't join room ${roomId}, emitting full_room socket event`)
            socket.emit('full_room', roomId)
        }
    })

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId}`)
        socket.broadcast.to(roomId).emit('start_call')
    })

    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
    })

    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
    })

    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
    })




    // console.log(`Client with id ${socket.id} connected`);
    // clients.push(socket.id);

    // // Желание нового пользователя присоединиться к комнате
    // socket.on("room", function (message) {
    //     var json = JSON.parse(message);
    //     // Добавляем сокет в список пользователей
    //     users[json.id] = socket;
    //     if (socket.room !== undefined) {
    //         // Если сокет уже находится в какой-то комнате, выходим из нее
    //         socket.leave(socket.room);
    //     }
    //     // Входим в запрошенную комнату
    //     socket.room = json.room;
    //     socket.join(socket.room);
    //     socket.user_id = json.id;
    //     // Отправялем остальным клиентам в этой комнате сообщение о присоединении нового участника
    //     socket.broadcast.to(socket.room).emit("new", json.id);
    // });

    // // Сообщение, связанное с WebRTC (SDP offer, SDP answer или ICE candidate)
    // socket.on("webrtc", function (message) {
    //     var json = JSON.parse(message);
    //     if (json.to !== undefined && users[json.to] !== undefined) {
    //         // Если в сообщении указан получатель и этот получатель известен серверу, отправляем сообщение только ему...
    //         users[json.to].emit("webrtc", message);
    //     } else {
    //         // ...иначе считаем сообщение широковещательным
    //         socket.broadcast.to(socket.room).emit("webrtc", message);
    //     }
    // });



    // socket.on('disconnect', () => {
    //     clients.splice(clients.indexOf(socket.id), 1);
    //     console.log(`Client with id ${socket.id} disconnected`);
    // });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.render('index'));

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
});





//const httpServer = http.createServer(app);
//const httpsServer = https.createServer(options, app);

//httpServer.listen(7002);
//httpsServer.listen(port, () => console.log(`Server listens on port: ${port}`));