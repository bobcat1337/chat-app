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

    socket.on('new_poll', (data) => {
        io.to(data.room).emit('new_poll', data.pollData);
    });

    socket.on('poll_vote', (data) => {
        const poll = data.pollData;
        if (!poll.voters.includes(data.voter)) {
            poll.votes[data.option]++;
            poll.voters.push(data.voter);
            io.to(data.room).emit('poll_update', poll);
        }
    });

    socket.on('private_message', (data) => {
        const recipientSocket = findSocketByUsername(data.recipient);
        if (recipientSocket) {
            // Send to recipient
            io.to(recipientSocket.id).emit('private_message', {
                sender: data.sender,
                recipient: data.recipient,
                message: data.message,
                isReceived: true,
                private: true
            });
            
            // Send confirmation to sender
            socket.emit('private_message', {
                sender: data.sender,
                recipient: data.recipient,
                message: data.message,
                isSent: true,
                private: true
            });
        }
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
        if (room === 'politikk' || room === 'sport') {
            roomInfo[room] = clients.size;
        }
    });
    return roomInfo;
}

function findSocketByUsername(username) {
    let foundSocket = null;
    io.sockets.sockets.forEach((socket) => {
        if (activeUsers.get(socket.id) === username) {
            foundSocket = socket;
        }
    });
    return foundSocket;
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
