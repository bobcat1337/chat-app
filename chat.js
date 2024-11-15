const socket = io(window.location.origin);

// Check authentication
const currentUser = sessionStorage.getItem('currentUser');
const chatRoom = sessionStorage.getItem('chatRoom');
if (!currentUser || !chatRoom) {
    window.location.href = 'index.html';
}

// Send join event with username and room
socket.emit('join', { username: currentUser, room: chatRoom });

// Listen for messages
socket.on('message', (data) => {
    // Only add messages that are not private to the main chat
    if (!data.isPrivate && !data.private) {
        addMessage(data.username, data.message);
    }
});

// Listen for active users list
socket.on('activeUsers', (users) => {
    console.log('Active users:', users);
    renderActiveUsers(users);
});

// Listen for room info
socket.on('roomInfo', (rooms) => {
    console.log('Room info:', rooms);
    renderOtherRooms(rooms);
});

// Render other rooms
function renderOtherRooms(rooms) {
    const otherRoomsDiv = document.getElementById('otherRooms');
    otherRoomsDiv.innerHTML = '';
    
    // Only show default rooms
    Object.entries(rooms).forEach(([room, count]) => {
        if (room !== chatRoom && (room === 'politikk' || room === 'sport')) {
            const roomButton = document.createElement('button');
            roomButton.className = 'other-room-button';
            
            const icon = room === 'politikk' ? 'fas fa-landmark' : 'fas fa-futbol';
            
            roomButton.innerHTML = `
                <i class="${icon}"></i>
                <span class="room-name">${capitalizeFirstLetter(room)}</span>
                <span class="user-count">${count} online</span>
            `;
            
            roomButton.onclick = () => switchRoom(room);
            otherRoomsDiv.appendChild(roomButton);
        }
    });
}

function switchRoom(newRoom) {
    socket.emit('leave', { username: currentUser, room: chatRoom });
    chatRoom = newRoom;
    sessionStorage.setItem('chatRoom', chatRoom);
    socket.emit('join', { username: currentUser, room: chatRoom });
    document.getElementById('chatBox').innerHTML = ''; // Clear chat box
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let messageTimestamps = [];
const maxMessages = 3; // Maximum number of messages
const timeWindow = 5000; // Time window in milliseconds (5 seconds)
const timeoutDuration = 15000; // Timeout duration in milliseconds (15 seconds)

const maxChars = 300; // Maximum number of characters allowed

function updateCharCount() {
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    const currentLength = messageInput.value.length;
    charCount.textContent = `${currentLength}/${maxChars}`;

    if (currentLength > maxChars) {
        charCount.style.color = 'red';
    } else {
        charCount.style.color = '#b0b3b8';
    }
}

// Send message function
function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value.trim();

    // Check for maximum character limit
    if (message.length > maxChars) {
        alert(`Meldingen din kan ikke inneholde mer enn ${maxChars} tegn.`);
        return;
    }

    if (message) {
        const messageData = {
            username: currentUser,
            message: message,
            room: chatRoom
        };
        
        socket.emit('message', messageData);
        messageInput.value = '';
        updateCharCount(); // Reset character count after sending
    }
}

// Add event listener to update character count on input
document.getElementById('message').addEventListener('input', updateCharCount);

// Add message to chat
function addMessage(username, message) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    const messageClass = username === currentUser ? 'sent' : 'received';
    messageDiv.className = `message ${messageClass}`;
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">${username.charAt(0).toUpperCase()}</div>
            <span class="username">${username}</span>
            <span class="time">${time}</span>
        </div>
        <div class="message-content">${message}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Render active users
function renderActiveUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'online-user';
        userDiv.innerHTML = `
            <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
            <span>${user}</span>
            <div class="online-indicator"></div>
        `;
        
        // Only add click handler if it's not the current user
        if (user !== currentUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => openPrivateChat(user);
        }
        
        usersList.appendChild(userDiv);
    });
}

// Render room info
function renderRoomInfo(rooms) {
    const roomInfo = document.getElementById('roomInfo');
    roomInfo.innerHTML = '';
    
    for (const [room, count] of Object.entries(rooms)) {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-info';
        roomDiv.innerHTML = `
            <span>${room}: ${count} brukere</span>
        `;
        roomInfo.appendChild(roomDiv);
    }
}

// Initialize
document.getElementById('message').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial render
renderActiveUsers([]);

// Mobile toggle for users list
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleUsers');
    const usersContainer = document.querySelector('.users-container');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Toggle users list
    toggleButton.addEventListener('click', function() {
        usersContainer.classList.toggle('show');
        overlay.classList.toggle('show');
    });

    // Close users list when clicking overlay
    overlay.addEventListener('click', function() {
        usersContainer.classList.remove('show');
        overlay.classList.remove('show');
    });

    // Close users list when switching rooms
    const originalSwitchRoom = window.switchRoom;
    window.switchRoom = function(newRoom) {
        if (originalSwitchRoom) {
            originalSwitchRoom(newRoom);
        }
        usersContainer.classList.remove('show');
        overlay.classList.remove('show');
    };
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleUsers');
    const usersContainer = document.querySelector('.users-container');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Toggle menu
    toggleButton.addEventListener('click', function() {
        usersContainer.classList.toggle('show');
        overlay.classList.toggle('show');
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
        usersContainer.classList.remove('show');
        overlay.classList.remove('show');
    });
});

let polls = new Map();

function openPollModal() {
    document.getElementById('pollModal').style.display = 'block';
}

function closePollModal() {
    document.getElementById('pollModal').style.display = 'none';
    document.getElementById('pollQuestion').value = '';
    document.getElementById('pollOptions').innerHTML = `
        <input type="text" class="poll-option" placeholder="Alternativ 1" maxlength="50">
        <input type="text" class="poll-option" placeholder="Alternativ 2" maxlength="50">
    `;
}

function addPollOption() {
    const optionsDiv = document.getElementById('pollOptions');
    const optionCount = optionsDiv.getElementsByClassName('poll-option').length;
    if (optionCount < 5) {
        const newOption = document.createElement('input');
        newOption.type = 'text';
        newOption.className = 'poll-option';
        newOption.placeholder = `Alternativ ${optionCount + 1}`;
        newOption.maxLength = 50;
        optionsDiv.appendChild(newOption);
    }
}

function createPoll() {
    const question = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    if (!question || options.length < 2) {
        alert('Vennligst fyll ut spørsmål og minst to alternativer');
        return;
    }

    const pollId = Date.now().toString();
    const pollData = {
        id: pollId,
        question: question,
        options: options,
        votes: Object.fromEntries(options.map(opt => [opt, 0])),
        voters: []
    };

    socket.emit('new_poll', {
        pollData: pollData,
        room: chatRoom
    });

    closePollModal();
}

function votePoll(pollId, option) {
    const poll = polls.get(pollId);
    if (poll && !poll.voters.includes(currentUser)) {
        socket.emit('poll_vote', {
            pollData: poll,
            option: option,
            voter: currentUser,
            room: chatRoom
        });
    } else if (poll.voters.includes(currentUser)) {
        // Optional: Show message that user already voted
        alert('Du har allerede stemt på denne avstemningen');
    }
}

// Add these socket listeners
socket.on('new_poll', (data) => {
    polls.set(data.id, data);
    addPollMessage(data);
});

socket.on('poll_update', (data) => {
    polls.set(data.id, data);
    updatePollResults(data);
});

function addPollMessage(pollData) {
    const chatBox = document.getElementById('chatBox');
    const pollDiv = document.createElement('div');
    pollDiv.className = 'poll-message';
    pollDiv.id = `poll-${pollData.id}`;
    
    let optionsHtml = pollData.options.map(option => `
        <button class="poll-option-btn" onclick="votePoll('${pollData.id}', '${option}')">
            ${option}
            <div class="poll-bar" style="width: 0%"></div>
            <span class="vote-count">0 stemmer</span>
        </button>
    `).join('');

    pollDiv.innerHTML = `
        <div class="poll-question">${pollData.question}</div>
        <div class="poll-options">
            ${optionsHtml}
        </div>
    `;
    
    chatBox.appendChild(pollDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updatePollResults(pollData) {
    const pollDiv = document.getElementById(`poll-${pollData.id}`);
    if (!pollDiv) return;

    const totalVotes = Object.values(pollData.votes).reduce((a, b) => a + b, 0);
    
    pollData.options.forEach(option => {
        const votes = pollData.votes[option];
        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
        
        // Update the selector to properly find the button
        const optionBtn = Array.from(pollDiv.querySelectorAll('.poll-option-btn'))
            .find(btn => btn.textContent.includes(option));
        
        if (optionBtn) {
            optionBtn.querySelector('.poll-bar').style.width = `${percentage}%`;
            optionBtn.querySelector('.vote-count').textContent = `${votes} stemmer`;
            
            // Disable button if user has voted
            if (pollData.voters.includes(currentUser)) {
                optionBtn.disabled = true;
                optionBtn.style.cursor = 'default';
            }
        }
    });
}

function openPrivateMessage(username) {
    document.getElementById('privateMessageModal').style.display = 'block';
    document.getElementById('recipientName').textContent = username;
    document.getElementById('privateMessage').focus();
}

function closePrivateModal() {
    document.getElementById('privateMessageModal').style.display = 'none';
    document.getElementById('privateMessage').value = '';
}

function sendPrivateMessage(recipient) {
    const input = document.getElementById(`input-${recipient}`);
    const message = input.value.trim();
    
    if (message) {
        socket.emit('private_message', {
            sender: currentUser,
            recipient: recipient,
            message: message,
            private: true
        });
        input.value = '';
    }
}

// Modify the renderActiveUsers function to add click handlers
function renderActiveUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'online-user';
        userDiv.innerHTML = `
            <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
            <span>${user}</span>
            <div class="online-indicator"></div>
        `;
        
        // Only add click handler if it's not the current user
        if (user !== currentUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => openPrivateChat(user);
        }
        
        usersList.appendChild(userDiv);
    });
}

// Modify the addMessage function to handle private messages
function addMessage(username, message, isPrivate = false, recipient = null) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    const messageClass = username === currentUser ? 'sent' : 'received';
    messageDiv.className = `message ${messageClass} ${isPrivate ? 'private' : ''}`;
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let privateLabel = '';
    if (isPrivate) {
        privateLabel = username === currentUser ? 
            `<span class="private-label">Privat til ${recipient}</span>` :
            '<span class="private-label">Privat melding</span>';
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">${username.charAt(0).toUpperCase()}</div>
            <span class="username">${username}</span>
            <span class="time">${time}</span>
        </div>
        ${privateLabel}
        <div class="message-content">${message}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Replace the existing private message socket listener
socket.on('private_message', (data) => {
    if (data.isReceived) {
        // Receiving a private message
        addMessage(data.sender, data.message, true, `fra ${data.sender}`);
    } else if (data.isSent) {
        // Sending a private message
        addMessage(data.sender, data.message, true, `til ${data.recipient}`);
    }
});

let privateChats = {};

function openPrivateChat(username) {
    if (!privateChats[username]) {
        privateChats[username] = [];
        
        // Create container if it doesn't exist
        let chatsContainer = document.getElementById('privateChats');
        if (!chatsContainer) {
            chatsContainer = document.createElement('div');
            chatsContainer.id = 'privateChats';
            chatsContainer.className = 'private-chats';
            document.body.appendChild(chatsContainer);
        }
        
        const chatWindow = document.createElement('div');
        chatWindow.className = 'private-chat-window';
        chatWindow.id = `chat-${username}`;
        
        chatWindow.innerHTML = `
            <div class="private-chat-header">
                <span>${username}</span>
                <div class="header-controls">
                    <span class="minimize-btn" onclick="toggleMinimize('${username}')">−</span>
                    <span class="close-btn" onclick="closePrivateChat('${username}')">&times;</span>
                </div>
            </div>
            <div class="private-chat-messages" id="messages-${username}"></div>
            <div class="private-chat-input">
                <input type="text" 
                       placeholder="Skriv en melding..." 
                       id="input-${username}"
                       maxlength="300"
                       onkeypress="handlePrivateKeyPress(event, '${username}')">
                <button onclick="sendPrivateMessage('${username}')">Send</button>
            </div>
        `;
        
        chatsContainer.appendChild(chatWindow);
    }
}

function handlePrivateKeyPress(event, recipient) {
    if (event.key === 'Enter') {
        sendPrivateMessage(recipient);
    }
}

function addPrivateMessage(username, message, sender) {
    if (!privateChats[username]) {
        openPrivateChat(username);
    }
    
    const messagesDiv = document.getElementById(`messages-${username}`);
    const messageElement = document.createElement('div');
    messageElement.className = `private-message ${sender === currentUser ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleMinimize(username) {
    const chatWindow = document.getElementById(`chat-${username}`);
    chatWindow.classList.toggle('minimized');
}

function closePrivateChat(username) {
    const chatWindow = document.getElementById(`chat-${username}`);
    chatWindow.remove();
    delete privateChats[username];
}

function minimizeAllChats() {
    Object.keys(privateChats).forEach(username => {
        const chatWindow = document.getElementById(`chat-${username}`);
        chatWindow.classList.add('minimized');
    });
}

// Modify the existing private message socket listener
socket.on('private_message', (data) => {
    const otherUser = data.sender === currentUser ? data.recipient : data.sender;
    addPrivateMessage(otherUser, data.message, data.sender);
});
