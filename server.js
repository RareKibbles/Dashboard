// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (HTML, CSS, JS, and uploaded files)
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse JSON bodies for POST requests
app.use(express.json());

// Set up file upload with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ success: true, filePath });
});

// API endpoint to serve scraped data
app.get('/api/scraped-data', (req, res) => {
    fs.readFile('scraped_data.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading data');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// API endpoint to serve Kaggle dataset data
app.get('/api/kaggle-dataset', (req, res) => {
    const filePath = path.join(__dirname, 'scraped_data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading scraped_data.json:', err);
            return res.status(500).json({ error: 'Failed to load dataset data.' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            console.error('Error parsing scraped_data.json:', parseError);
            res.status(500).json({ error: 'Failed to parse dataset data.' });
        }
    });
});

// User Management /////////////////////////////////////////////////////////////////////////////////////
// Load users from users.json or initialize an empty array
let users = [];
const usersFilePath = path.join(__dirname, 'users.json');
if (fs.existsSync(usersFilePath)) {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
        // Ensure all users have a balance field, default to 0 if missing
        users = users.map(user => ({
            ...user,
            balance: user.balance !== undefined ? user.balance : 0
        }));
        console.log('Loaded users from users.json:', users);
    } catch (err) {
        console.error('Error loading users from users.json:', err);
        users = [];
    }
} else {
    // Create users.json if it doesn't exist
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
    console.log('Created users.json');
}

// Function to save users to users.json
function saveUsers() {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
        console.log('Users saved to users.json');
    } catch (err) {
        console.error('Error saving users to users.json:', err);
    }
}

// Session Management //////////////////////////////////////////////////////////////////////////////////
// Load sessions from sessions.json or initialize an empty array
let sessions = [];
const sessionsFilePath = path.join(__dirname, 'sessions.json');
if (fs.existsSync(sessionsFilePath)) {
    try {
        const data = fs.readFileSync(sessionsFilePath, 'utf8');
        sessions = JSON.parse(data);
        console.log('Loaded sessions from sessions.json:', sessions);
    } catch (err) {
        console.error('Error loading sessions from sessions.json:', err);
        sessions = [];
    }
} else {
    // Create sessions.json if it doesn't exist
    fs.writeFileSync(sessionsFilePath, JSON.stringify([]));
    console.log('Created sessions.json');
}

// Function to save sessions to sessions.json
function saveSessions() {
    try {
        fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2), 'utf8');
        console.log('Sessions saved to sessions.json');
        return true;
    } catch (err) {
        console.error('Error saving sessions to sessions.json:', err);
        return false;
    }
}

// Messages, Transfers, Contacts ///////////////////////////////////////////////////////////////////////
let messages = {};
const messagesFilePath = path.join(__dirname, 'messages.json');
if (fs.existsSync(messagesFilePath)) {
    try {
        const data = fs.readFileSync(messagesFilePath, 'utf8');
        messages = JSON.parse(data);
        console.log('Loaded messages from messages.json:', messages);
    } catch (err) {
        console.error('Error loading messages from messages.json:', err);
        messages = {};
    }
} else {
    fs.writeFileSync(messagesFilePath, JSON.stringify({}));
    console.log('Created messages.json');
}

function saveMessages() {
    try {
        fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');
        console.log('Messages saved to messages.json');
    } catch (err) {
        console.error('Error saving messages to messages.json:', err);
    }
}

let transfers = {};
const transfersFilePath = path.join(__dirname, 'transfers.json');
if (fs.existsSync(transfersFilePath)) {
    try {
        const data = fs.readFileSync(transfersFilePath, 'utf8');
        transfers = JSON.parse(data);
        console.log('Loaded transfers from transfers.json:', JSON.stringify(transfers, null, 2));
    } catch (err) {
        console.error('Error loading transfers from transfers.json:', err.message);
        transfers = {};
    }
} else {
    fs.writeFileSync(transfersFilePath, JSON.stringify({}));
    console.log('Created transfers.json');
}

function saveTransfers() {
    try {
        Object.keys(transfers).forEach(userId => {
            transfers[userId].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        fs.writeFileSync(transfersFilePath, JSON.stringify(transfers, null, 2), 'utf8');
        console.log('Transfers saved to transfers.json:', JSON.stringify(transfers, null, 2));
    } catch (err) {
        console.error('Error saving transfers to transfers.json:', err.message);
    }
}

let contacts = {};
const contactsFilePath = path.join(__dirname, 'contacts.json');
if (fs.existsSync(contactsFilePath)) {
    try {
        const data = fs.readFileSync(contactsFilePath, 'utf8');
        contacts = JSON.parse(data);
        console.log('Loaded contacts from contacts.json:', JSON.stringify(contacts, null, 2));
    } catch (err) {
        console.error('Error loading contacts from contacts.json:', err.message);
        contacts = {};
    }
} else {
    fs.writeFileSync(contactsFilePath, JSON.stringify({}));
    console.log('Created contacts.json');
}

function saveContacts() {
    try {
        fs.writeFileSync(contactsFilePath, JSON.stringify(contacts, null, 2), 'utf8');
        console.log('Contacts saved to contacts.json:', JSON.stringify(contacts, null, 2));
    } catch (err) {
        console.error('Error saving contacts to contacts.json:', err.message);
    }
}

// Function to update user balance
function updateUserBalance(userId, amount, deduct = true) {
    const user = users.find(u => u.userId === userId);
    if (!user) return false;
    if (deduct) {
        if (user.balance < amount) return false;
        user.balance -= parseFloat(amount);
    } else {
        user.balance += parseFloat(amount);
    }
    saveUsers();
    io.to(userId).emit('userBalance', { balance: user.balance });
    console.log(`Updated balance for user ${userId}:`, user.balance);
    return true;
}

// User Routes /////////////////////////////////////////////////////////////////////////////////////////
// Handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });
    const user = users.find(u => u.username === username);

    if (!user) {
        console.log('Login failed: Invalid username or password');
        return res.status(401).json({ success: false, message: 'Invalid username or password. Please try again' });
    }

    try {
        let isMatch = false;

        // Check if the password is hashed or plain-text
        if (user.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, user.password); // Compare hashed password
        } else {
            isMatch = user.password === password; // Compare plain-text password
        }

        if (!isMatch) {
            console.log('Login failed: Invalid username or password');
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessions = sessions.filter(s => s.userId !== user.userId); // Remove existing sessions for this user
        sessions.push({ sessionId, userId: user.userId });
        saveSessions();
        console.log('Session created:', { sessionId, userId: user.userId });

        res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`);
        res.json({ success: true, userId: user.userId, username: user.username });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Error logging in.' });
    }
});

// Handle account creation
app.post('/create-account', async (req, res) => {
    const { username, password } = req.body;
    console.log('Account creation attempt:', { username });

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        console.log('Account creation failed: Password does not meet requirements');
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character.'
        });
    }

    if (users.some(u => u.username === username)) {
        console.log('Account creation failed: Username already exists');
        return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        console.log('Hashed password:', hashedPassword); // Debug log for hashed password

        const userId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const newUser = { userId, username, password: hashedPassword, balance: 0 };
        users.push(newUser);
        console.log('New user object before saving:', newUser); // Debug log for new user object

        saveUsers();
        console.log('User saved successfully'); // Debug log for successful save

        const sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessions.push({ sessionId, userId });
        saveSessions();
        console.log('Session created for new user:', { sessionId, userId });

        res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`);
        res.json({ success: true, userId, username });
    } catch (error) {
        console.error('Error during account creation:', error); // Debug log for errors
        res.status(500).json({ success: false, message: 'Error creating account.' });
    }
});

// Handle session check
app.get('/check-session', (req, res) => {
    console.log('Received /check-session request, headers:', req.headers);
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {}) : {};

    const sessionId = cookies.sessionId;
    console.log('Checking session, sessionId:', sessionId);
    if (!sessionId) {
        console.log('No sessionId cookie found');
        res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; SameSite=Lax');
        return res.json({ success: false, message: 'No session cookie' });
    }

    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) {
        console.log('No session found for sessionId:', sessionId);
        res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; SameSite=Lax');
        return res.json({ success: false, message: 'Invalid session' });
    }

    const user = users.find(u => u.userId === session.userId);
    if (!user) {
        console.log('User not found for session:', session);
        res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; SameSite=Lax');
        return res.json({ success: false, message: 'User not found' });
    }

    console.log('Session valid, user found:', { username: user.username, userId: user.userId });
    res.json({ success: true, userId: user.userId, username: user.username });
});

// Handle logout
app.post('/logout', (req, res) => {
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {}) : {};

    const sessionId = cookies.sessionId;
    console.log('Logging out, sessionId:', sessionId);
    sessions = sessions.filter(s => s.sessionId !== sessionId);
    saveSessions();
    console.log('Session removed, remaining sessions:', sessions);

    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0; SameSite=Lax');
    res.json({ success: true });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Helper function to get userId from session cookie
    function getUserIdFromSocket(socket) {
        const cookies = socket.handshake.headers.cookie ? socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) : {};

        const sessionId = cookies.sessionId;
        const session = sessions.find(s => s.sessionId === sessionId);
        return session ? session.userId : null;
    }

    // Send existing messages to the new user (user-specific history)
    const userId = getUserIdFromSocket(socket);
    if (userId) {
        if (!messages[userId]) {
            messages[userId] = [];
        }
        const filteredMessages = messages[userId].filter(message => message && message.type !== 'bot');
        socket.emit('chatHistory', filteredMessages);
        console.log(`Sent filtered chatHistory to user ${userId}:`, filteredMessages);
    } else {
        console.log('No userId found, sending empty chat history');
        socket.emit('chatHistory', []);
    }

    // Send existing transfers to the new user (user-specific history)
    if (userId) {
        if (!transfers[userId]) {
            transfers[userId] = [];
        }
        socket.emit('p2pTransactionHistory', transfers[userId]);
        console.log(`Sent p2pTransactionHistory to user ${userId}:`, transfers[userId]);
    } else {
        console.log('No userId found, sending empty transaction history');
        socket.emit('p2pTransactionHistory', []);
    }

    // Send user's balance on connection
    if (userId) {
        const user = users.find(u => u.userId === userId);
        if (user) {
            socket.emit('userBalance', { balance: user.balance });
            console.log(`Sent balance to user ${userId}:`, user.balance);
        }
    }

    // Handle request for user balance
    socket.on('requestBalance', () => {
        const userId = getUserIdFromSocket(socket);
        if (userId) {
            const user = users.find(u => u.userId === userId);
            if (user) {
                socket.emit('userBalance', { balance: user.balance });
                console.log(`Sent balance to user ${userId} upon request:`, user.balance);
            }
        }
    });

    // Handle new messages (user-specific history)
    socket.on('sendMessage', (messageData) => {
        const userId = messageData.userId;
        if (!userId) {
            console.log('No userId provided in messageData');
            return;
        }

        if (!messages[userId]) {
            messages[userId] = [];
        }

        const messageId = messages[userId].length;
        messages[userId].push(messageData);
        saveMessages();
        socket.emit('message', messageData, messageId);
        console.log('Message received and sent to user:', messageData, 'Message ID:', messageId);
    });

    // Handle file uploads (user-specific history)
    socket.on('uploadFile', (fileData) => {
        console.log('Received uploadFile event:', fileData);
        const userId = fileData.userId;
        if (!userId) {
            console.log('No userId provided in fileData');
            return;
        }

        if (!messages[userId]) {
            messages[userId] = [];
        }

        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileMessage = {
            type: 'file',
            userName: fileData.userName,
            userId: fileData.userId,
            content: {
                fileId: fileId,
                fileName: fileData.name,
                filePath: fileData.path,
                isImage: fileData.name.match(/\.(jpg|jpeg|png|gif)$/i) !== null
            },
            timestamp: fileData.timestamp,
            status: 'Sent',
            messageId: fileData.messageId
        };
        const messageId = messages[userId].length;
        messages[userId].push(fileMessage);
        saveMessages();
        socket.emit('message', fileMessage, messageId);
        console.log('File message stored and sent to user:', fileMessage, 'Message ID:', messageId);
    });

    // Handle message editing (user-specific history)
    socket.on('editMessage', ({ messageId, newContent, userId }) => {
        if (!userId || !messages[userId] || !messages[userId][messageId]) {
            console.log('Invalid edit request:', { messageId, userId });
            return;
        }

        if (messages[userId][messageId].type !== 'file' && messages[userId][messageId].userId === userId) {
            messages[userId][messageId].content = newContent;
            saveMessages();
            socket.emit('messageEdited', { messageId, newContent });
            console.log('Message edited:', messageId, newContent);
        }
    });

    // Handle message deletion (user-specific history)
    socket.on('deleteMessage', ({ messageId, userId }) => {
        if (!userId || !messages[userId] || !messages[userId][messageId]) {
            console.log('Invalid delete request:', { messageId, userId });
            return;
        }

        if (messages[userId][messageId].userId === userId) {
            messages[userId][messageId] = null;
            saveMessages();
            socket.emit('messageDeleted', messageId);
            console.log('Message deleted:', messageId);
        }
    });

    // Handle typing events (shared history)
    socket.on('typing', (data) => {
        socket.broadcast.emit('userTyping', data);
        console.log(`${data.userName} is typing...`);
    });

    socket.on('stopTyping', (data) => {
        socket.broadcast.emit('userStoppedTyping', data);
        console.log(`${data.userName} stopped typing.`);
    });

    // Handle mock send money transactions
    socket.on('sendMoney', (transactionData) => {
        console.log('Received sendMoney event:', transactionData);
        const userId = transactionData.userId;
        if (!userId) {
            console.log('No userId provided in transactionData');
            socket.emit('transactionError', { message: 'User not authenticated.' });
            return;
        }

        const amount = parseFloat(transactionData.amount);
        if (isNaN(amount) || amount <= 0) {
            console.log('Invalid amount in transactionData:', amount);
            socket.emit('transactionError', { message: 'Invalid amount.' });
            return;
        }

        const user = users.find(u => u.userId === userId);
        if (!user) {
            console.log(`User ${userId} not found`);
            socket.emit('transactionError', { message: 'User not found.' });
            return;
        }

        if (user.balance < amount) {
            console.log(`Insufficient balance for user ${userId}: ${user.balance} < ${amount}`);
            socket.emit('transactionError', { message: 'Insufficient balance.' });
            return;
        }

        if (!transfers[userId]) {
            transfers[userId] = [];
        }

        const transaction = {
            type: 'sent',
            userName: transactionData.userName,
            userId: transactionData.userId,
            peer: transactionData.peer,
            amount: amount,
            timestamp: transactionData.timestamp,
            note: transactionData.note,
            date: transactionData.date || new Date().toISOString(),
            transactionId: transactionData.transactionId || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
            status: 'completed'
        };

        const balanceUpdated = updateUserBalance(userId, amount, true);
        if (!balanceUpdated) {
            socket.emit('transactionError', { message: 'Failed to update balance.' });
            return;
        }

        const recipient = users.find(u => u.username === transactionData.peer);
        if (recipient) {
            updateUserBalance(recipient.userId, amount, false);
            if (!transfers[recipient.userId]) {
                transfers[recipient.userId] = [];
            }
            const recipientTransaction = {
                ...transaction,
                type: 'received',
                userName: recipient.username,
                userId: recipient.userId,
                peer: transactionData.userName
            };
            transfers[recipient.userId].push(recipientTransaction);
            io.to(recipient.userId).emit('newP2PTransaction', recipientTransaction);
            console.log('Emitted newP2PTransaction to recipient:', recipientTransaction);
        }

        transfers[userId].push(transaction);
        saveTransfers();
        socket.emit('moneySent', transactionData);
        socket.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction to user:', transaction);
    });

    // Handle payment requests
    socket.on('requestPayment', (requestData) => {
        console.log('Received requestPayment event:', requestData);
        const userId = requestData.userId;
        if (!userId) {
            console.log('No userId provided in requestData');
            socket.emit('transactionError', { message: 'User not authenticated.' });
            return;
        }

        const amount = parseFloat(requestData.amount);
        if (isNaN(amount) || amount <= 0) {
            console.log('Invalid amount in requestData:', amount);
            socket.emit('transactionError', { message: 'Invalid amount.' });
            return;
        }

        if (!transfers[userId]) {
            transfers[userId] = [];
        }

        const transaction = {
            type: 'requested',
            userName: requestData.userName,
            userId: requestData.userId,
            peer: requestData.peer,
            amount: amount,
            timestamp: requestData.timestamp,
            note: requestData.note,
            date: requestData.date || new Date().toISOString(),
            transactionId: requestData.transactionId || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
            status: 'pending'
        };
        transfers[userId].push(transaction);

        const recipient = users.find(u => u.username === requestData.peer);
        if (recipient) {
            if (!transfers[recipient.userId]) {
                transfers[recipient.userId] = [];
            }
            const recipientTransaction = {
                ...transaction,
                type: 'request-received',
                userName: recipient.username,
                userId: recipient.userId,
                peer: requestData.userName,
                status: 'pending'
            };
            transfers[recipient.userId].push(recipientTransaction);
            io.to(recipient.userId).emit('newP2PTransaction', recipientTransaction);
            console.log('Emitted newP2PTransaction (request) to recipient:', recipientTransaction);
        }

        saveTransfers();
        socket.emit('paymentRequested', requestData);
        socket.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction to user:', transaction);
    });

    // Handle approving a payment request
    socket.on('approveRequest', ({ transactionId, userId, peer, amount }) => {
        console.log('Received approveRequest event:', { transactionId, userId, peer, amount });

        const user = users.find(u => u.userId === userId);
        if (!user) {
            socket.emit('transactionError', { message: 'User not found.' });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (user.balance < parsedAmount) {
            socket.emit('transactionError', { message: 'Insufficient balance.' });
            return;
        }

        if (transfers[userId]) {
            const transaction = transfers[userId].find(t => t.transactionId === transactionId && t.type === 'request-received');
            if (transaction && transaction.status === 'pending') {
                transaction.status = 'approved';

                const balanceUpdated = updateUserBalance(userId, parsedAmount, true);
                if (!balanceUpdated) {
                    socket.emit('transactionError', { message: 'Failed to update balance.' });
                    return;
                }

                const requester = users.find(u => u.username === peer);
                if (requester) {
                    updateUserBalance(requester.userId, parsedAmount, false);

                    if (transfers[requester.userId]) {
                        const requesterTransaction = transfers[requester.userId].find(t => t.transactionId === transactionId && t.type === 'requested');
                        if (requesterTransaction) {
                            requesterTransaction.status = 'approved';
                            io.to(requester.userId).emit('requestStatusUpdate', {
                                transactionId,
                                status: 'approved',
                                peer: user.username
                            });
                        }
                    }

                    const completedTransactionForApprover = {
                        type: 'sent',
                        userName: user.username,
                        userId: userId,
                        peer: peer,
                        amount: parsedAmount,
                        timestamp: new Date().toISOString(),
                        note: transaction.note,
                        date: new Date().toISOString(),
                        transactionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        status: 'completed'
                    };
                    transfers[userId].push(completedTransactionForApprover);
                    socket.emit('newP2PTransaction', completedTransactionForApprover);

                    const completedTransactionForRequester = {
                        type: 'received',
                        userName: requester.username,
                        userId: requester.userId,
                        peer: user.username,
                        amount: parsedAmount,
                        timestamp: new Date().toISOString(),
                        note: transaction.note,
                        date: new Date().toISOString(),
                        transactionId: completedTransactionForApprover.transactionId,
                        status: 'completed'
                    };
                    transfers[requester.userId].push(completedTransactionForRequester);
                    io.to(requester.userId).emit('newP2PTransaction', completedTransactionForRequester);
                }

                saveTransfers();
                socket.emit('requestApproved', { transactionId, peer, amount: parsedAmount });
            }
        }
    });

    // Handle declining a payment request
    socket.on('declineRequest', ({ transactionId, userId, peer }) => {
        console.log('Received declineRequest event:', { transactionId, userId, peer });

        if (transfers[userId]) {
            const transaction = transfers[userId].find(t => t.transactionId === transactionId && t.type === 'request-received');
            if (transaction && transaction.status === 'pending') {
                transaction.status = 'declined';

                const requester = users.find(u => u.username === peer);
                if (requester && transfers[requester.userId]) {
                    const requesterTransaction = transfers[requester.userId].find(t => t.transactionId === transactionId && t.type === 'requested');
                    if (requesterTransaction) {
                        requesterTransaction.status = 'declined';
                        io.to(requester.userId).emit('requestStatusUpdate', {
                            transactionId,
                            status: 'declined',
                            peer: user.username
                        });
                    }
                }

                saveTransfers();
                socket.emit('requestDeclined', { transactionId, peer });
            }
        }
    });

    // Handle request for P2P transaction history
    socket.on('requestP2PTransactionHistory', () => {
        const userId = getUserIdFromSocket(socket);
        if (userId) {
            if (!transfers[userId]) {
                transfers[userId] = [];
            }
            socket.emit('p2pTransactionHistory', transfers[userId]);
            console.log(`Emitted p2pTransactionHistory to user ${userId}:`, transfers[userId]);
        } else {
            console.log('No userId found, sending empty transaction history');
            socket.emit('p2pTransactionHistory', []);
        }
    });

    // Handle adding P2P transactions (used by addTransaction in script.js)
    socket.on('addP2PTransaction', (transaction) => {
        console.log('Received addP2PTransaction:', transaction);
        const userId = getUserIdFromSocket(socket);
        if (!userId) {
            console.log('No userId found for addP2PTransaction');
            return;
        }

        transaction.userId = userId;
        transaction.date = transaction.date || new Date().toISOString();
        transaction.transactionId = transaction.transactionId || (Date.now() + '-' + Math.random().toString(36).substr(2, 9));

        if (!transfers[userId]) {
            transfers[userId] = [];
        }

        transfers[userId].push(transaction);
        saveTransfers();
        socket.emit('newP2PTransaction', transaction);
        console.log('Emitted newP2PTransaction to user:', transaction);
    });

    // Handle request for contacts
    socket.on('requestContacts', () => {
        const userId = getUserIdFromSocket(socket);
        if (userId) {
            if (!contacts[userId]) {
                contacts[userId] = [];
            }
            const updatedContacts = contacts[userId].map(contact => {
                const isOnline = sessions.some(session => session.userId === contact.contactId);
                return { ...contact, status: isOnline ? 'online' : 'offline' };
            });
            socket.emit('contactsList', updatedContacts);
            console.log(`Emitted contactsList to user ${userId}:`, updatedContacts);
        } else {
            console.log('No userId found, sending empty contacts list');
            socket.emit('contactsList', []);
        }
    });

    // Handle adding a new contact
    socket.on('addContact', ({ username }, callback) => {
        const userId = getUserIdFromSocket(socket);
        if (!userId) {
            console.log('No userId found for addContact');
            callback({ success: false, message: 'User not authenticated.' });
            return;
        }

        const contactUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!contactUser) {
            console.log(`Contact username ${username} not found in users.json`);
            callback({ success: false, message: 'Username does not exist.' });
            return;
        }

        const currentUser = users.find(u => u.userId === userId);
        if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
            console.log(`User ${userId} attempted to add themselves as a contact`);
            callback({ success: false, message: 'You cannot add yourself as a contact.' });
            return;
        }

        if (!contacts[userId]) {
            contacts[userId] = [];
        }
        if (contacts[userId].some(c => c.contactId === contactUser.userId)) {
            console.log(`Contact ${username} already exists for user ${userId}`);
            callback({ success: false, message: 'This contact already exists.' });
            return;
        }

        const isOnline = sessions.some(session => session.userId === contactUser.userId);
        const newContact = {
            contactId: contactUser.userId,
            username: contactUser.username,
            status: isOnline ? 'online' : 'offline'
        };
        contacts[userId].push(newContact);
        saveContacts();
        socket.emit('newContact', newContact);
        console.log(`Added new contact for user ${userId}:`, newContact);
        callback({ success: true, message: `Added ${username} to your contacts.` });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});