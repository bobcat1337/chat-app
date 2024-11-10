const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

let activeUsers = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (data) => {
        socket.join(data.room);
        socket.room = data.room;
        activeUsers.set(socket.id, data.username);
        io.to(data.room).emit('activeUsers', getActiveUsersInRoom(data.room));
        io.emit('roomInfo', getRoomInfo());
    });

    socket.on('leave', (data) => {
        socket.leave(data.room);
        io.to(data.room).emit('activeUsers', getActiveUsersInRoom(data.room));
        io.emit('roomInfo', getRoomInfo());
    });

    socket.on('message', (data) => {
        console.log('Message received:', data);
        io.to(data.room).emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        activeUsers.delete(socket.id);
        io.to(socket.room).emit('activeUsers', getActiveUsersInRoom(socket.room));
        io.emit('roomInfo', getRoomInfo());
    });
});

function getActiveUsersInRoom(room) {
    const clients = io.sockets.adapter.rooms.get(room) || new Set();
    const users = [];
    clients.forEach(clientId => {
        const clientSocket = io.sockets.sockets.get(clientId);
        if (clientSocket) {
            users.push(activeUsers.get(clientId));
        }
    });
    return users;
}

function getRoomInfo() {
    const roomInfo = {};
    io.sockets.adapter.rooms.forEach((clients, room) => {
        if (io.sockets.adapter.sids.get(room)) return; // Skip individual sockets
        roomInfo[room] = clients.size;
    });
    return roomInfo;
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
