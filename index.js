
const express = require('express');
const app = express();
http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const harperSaveMessage = require('./services/harper-save-message');

app.use(cors());

const server = http.createServer(app);
// listner get post from front
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const CHAT_BOT = 'ChatBot';
let chatRoom = '';
let allUsers = [];

// listner
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);


    // добавление в комнату
    socket.on('join_room', (data) => {
        const { username, room } = data;
        socket.join(room);

        // сохранение пользователей в комнате
        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);

        let __createdtime__ = Date.now();
        // рассылка всем кто в чате
        socket.to(room).emit('receive_message', {
            message: `${username} has joined the chat room`,
            username: CHAT_BOT,
            __createdtime__,
        });
         // welcome msg для нового пользователя в чате
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });
    });

    // отправка сообщения
    socket.on('send_message', (data) => {
        const { message, username, room, __createdtime__ } = data;
        io.in(room).emit('receive_message', data);
        harperSaveMessage(message, username, room, __createdtime__)
            .then((response) => console.log(response))
            .catch((err) => console.log(err));
    });
});


server.listen(4000, () => 'Server is running on port 3000');