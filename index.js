
const express = require('express');
const app = express();
http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const harperSaveMessage = require('./services/harper-save-message');
const harperGetMessages = require('./services/harper-get-messages');
const leaveRoom = require('./utils/leave-room');

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

    //выход из чата
    socket.on('leave_room', (data) => {
        const { username, room } = data;
        socket.leave(room);
        const __createdtime__ = Date.now();
        allUsers = leaveRoom(socket.id, allUsers);
        socket.to(room).emit('chatroom_users', allUsers);
        socket.to(room).emit('receive_message', {
            username: CHAT_BOT,
            message: `${username} has left the chat`,
            __createdtime__,
        });
    });

    //disconnect user
    socket.on('disconnect', () => {
        console.log('User disconnected from the chat');
        const user = allUsers.find((user) => user.id == socket.id);
        if (user?.username) {
            allUsers = leaveRoom(socket.id, allUsers);
            socket.to(chatRoom).emit('chatroom_users', allUsers);
            socket.to(chatRoom).emit('receive_message', {
                message: `${user.username} has disconnected from the chat.`,
            });
        }
    });

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
        //get 100 msg after join room
        harperGetMessages(room)
            .then((last100Messages) => {
                socket.emit('last_100_messages', last100Messages);
            })
            .catch((err) => console.log(err));
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