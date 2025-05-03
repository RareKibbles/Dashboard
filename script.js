// script.js

// Global Variables and Initialization
let userName; // Stores the user's name, set via sessionStorage
let userId; // Stores the user's unique ID
let currentTabIndex = 0; // Tracks the currently active tab index for tab switching
let transactions = []; // Array to store P2P transactions for the preview widget
let pendingTransactions = []; // Array to store all P2P transactions, including those not yet displayed
let lastLocalTransactionId = null; // Track the last locally added transaction ID
let userBalance = 0; // Tracks the user's current balance

// DOM Elements for Chat Functionality (Dashboard Widget)
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const themeToggle = document.getElementById('theme-toggle');
const contactSupport = document.getElementById('contact-support');
const readDocs = document.getElementById('read-docs');
const refreshTips = document.getElementById('refreshTips');
const resetSession = document.getElementById('reset-session');
const clearCache = document.getElementById('clear-cache');
const reconnectNetwork = document.getElementById('reconnect-network');
const purgeHistory = document.getElementById('purge-history');
const emojiPicker = document.getElementById('emoji-picker');
const expandButton = document.getElementById('expand-chat');
const closeButton = document.getElementById('close-chat');
const overlay = document.getElementById('dashboard-overlay');
const dashboardContainer = document.querySelector('.dashboard-container');



 // Serve static files from the 'assets' directory


// Serve static files

// API endpoint to serve scraped data


// Start the server



// Variables for Chat Expansion (Dashboard Widget)
let isExpanded = false; // Tracks if the chat window is expanded
let originalParent = null; // Stores the original parent of the chat window when expanded
let placeholder = null; // Placeholder element used during chat expansion

// Set to track processed messages and prevent duplicates
const processedMessages = new Set();

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Shared Bot Response Logic for Both Main Dashboard and P2P Tabs
function getBotResponse(userMessage) {
    if (!userMessage) return `Hello! How can I assist you today, ${userName}?`;
    userMessage = userMessage.toLowerCase();
    if (userMessage.includes('help')) return "I'm here to assist! What do you need help with?";
    if (userMessage.includes('time')) return `The current time is ${new Date().toLocaleTimeString()}.`;
    if (userMessage.includes('thanks')) return "You're welcome! 😊";
    return `Hello! How can I assist you today, ${userName}?`;
}

// Generational P2P Usage Setup
function setupGenerationalUsage() {
    const circleFills = document.querySelectorAll('.circle-fill-3d');
    circleFills.forEach(circle => {
        const percent = parseFloat(circle.getAttribute('data-percent')) || 0;
        const percentValue = (percent / 100) * 360; // Convert percentage to degrees for conic-gradient
        circle.style.setProperty('--percent', `${percentValue}deg`);
        console.log(`Set circle progress to ${percent}% (${percentValue}deg)`);
    });
}




// Consolidated DOMContentLoaded Event Listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and script started');

    // Login Page Logic
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent form submission
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                loginError.textContent = 'Please enter both username and password.';
                loginError.style.display = 'block';
                return;
            }

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Include cookies for session
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/index.html';
                    } else {
                        loginError.textContent = data.message || 'Login failed. Please try again.';
                        loginError.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Login error:', error);
                    loginError.textContent = 'An error occurred during login. Please try again.';
                    loginError.style.display = 'block';
                });
        });
        return; // Exit early for login page
    }

    // Create Account Page Logic
    const createAccountForm = document.getElementById('create-account-form');
    const createAccountError = document.getElementById('create-account-error');

    if (createAccountForm) {
        createAccountForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent form submission
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();

            if (!username || !password || !confirmPassword) {
                createAccountError.textContent = 'Please fill in all fields.';
                createAccountError.style.display = 'block';
                return;
            }

            if (password !== confirmPassword) {
                createAccountError.textContent = 'Passwords do not match.';
                createAccountError.style.display = 'block';
                return;
            }

            fetch('/create-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Include cookies for session
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/index.html';
                    } else {
                        createAccountError.textContent = data.message || 'Account creation failed. Please try again.';
                        createAccountError.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Account creation error:', error);
                    createAccountError.textContent = 'An error occurred during account creation. Please try again.';
                    createAccountError.style.display = 'block';
                });
        });
        return; // Exit early for create account page
    }

    // Skip session check on login/create account pages
    const currentPath = window.location.pathname.toLowerCase();
    const isAuthPage = ['/login.html', '/login', '/createaccount.html', '/createaccount', '/create-account.html', '/create-account'].some(path => currentPath.includes(path));
    if (isAuthPage) {
        console.log('Skipping session check on auth page:', currentPath);
        return;
    }

    // Debounced session check
    const checkSession = debounce(() => {
        fetch('/check-session', {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        })
            .then(response => {
                console.log('Session check response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Session check data:', data);
                if (!data.success) {
                    console.log('No valid session, redirecting to login.html');
                    window.location.href = '/login.html';
                    return;
                }

                // Set user data from session with fallbacks
                userName = data.username || 'Unknown';
                userId = data.userId || 'N/A';
                sessionStorage.setItem('userName', userName);
                sessionStorage.setItem('userId', userId);
                console.log('User logged in:', userName, 'User ID:', userId);

                // Update the login status display
                const loginStatus = document.getElementById('login-status');
                const userIdDisplay = document.getElementById('user-id');
                if (loginStatus) {
                    loginStatus.textContent = `Logged in as ${userName}`;
                    console.log('Updated login status display to:', loginStatus.textContent);
                } else {
                    console.error('Login status element not found');
                }
                if (userIdDisplay) {
                    userIdDisplay.textContent = `(ID: ${userId})`;
                    console.log('Updated user ID display to:', userIdDisplay.textContent);
                } else {
                    console.error('User ID display element not found');
                }

                // Initialize Socket.io
                const socket = io();
                console.log('Socket.io initialized');

                // Update balance display
                const balanceDisplay = document.querySelector('.balance-amount');
                socket.on('userBalance', ({ balance }) => {
                    userBalance = balance;
                    if (balanceDisplay) {
                        balanceDisplay.textContent = `$${userBalance.toFixed(2)}`;
                        console.log('Updated balance display:', userBalance);
                    }
                });
                socket.emit('requestBalance');

                // Tab Switching Setup
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');

                tabs.forEach((tab, index) => {
                    tab.addEventListener('click', () => {
                        const newTabIndex = index;
                        const direction = newTabIndex > currentTabIndex ? 'left' : 'right';

                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(content => {
                            content.classList.remove('active');
                            content.style.transform = direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
                        });

                        tab.classList.add('active');
                        const tabId = tab.getAttribute('data-tab');
                        const targetContent = document.getElementById(tabId);
                        if (targetContent) {
                            targetContent.classList.add('active');
                            targetContent.style.transform = 'translateX(0)';
                        }

                        currentTabIndex = newTabIndex;
                        console.log(`Switched to tab: ${tabId}`);

                        if (tabId === 'p2p') {
                            socket.emit('requestP2PTransactionHistory');
                            console.log('Requested P2P transaction history on tab switch');
                        }
                    });
                });

                // Request P2P transaction history on page load
                socket.emit('requestP2PTransactionHistory');

                // Initialize Features
                setupChat(socket);
                setupP2PChat(socket);
                setupEmojiPicker();
                setupP2PEmojiPicker();
                setupChatExpansion();
                setupP2PChatExpansion();
                setupQuickAccessTools();
                setupThemeToggle();
                setupFaqAndQna();
                setupChatbotSupport();
                setupSupportAnalytics();
                setupP2PTransfer(socket);
                setupBotChats(socket);
                setupViewButtons();
                setupContacts(socket);
                setupContactsPreview(socket);
                setupGenerationalUsage();

                // Setup Logout Button
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        console.log('Logout button clicked');
                        fetch('/logout', { method: 'POST', credentials: 'include' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    sessionStorage.removeItem('userName');
                                    sessionStorage.removeItem('userId');
                                    window.location.href = '/login.html';
                                } else {
                                    alert('Logout failed. Please try again.');
                                }
                            })
                            .catch(error => {
                                console.error('Logout error:', error);
                                alert('An error occurred during logout. Please try again.');
                            });
                    });
                }

                // Add fade-in effect
                window.addEventListener('load', () => {
                    const dashboardContainer = document.querySelector('.dashboard-container');
                    if (dashboardContainer) {
                        setTimeout(() => dashboardContainer.classList.add('fade'), 100);
                    }
                });
            })
            .catch(error => {
                console.error('Session check error:', error);
                window.location.href = '/login.html';
            });
    }, 1000); // Debounce session check to fire every 1 second at most

    checkSession();
});

function viewAllContacts() {
    switchTab('p2p');
    setTimeout(() => {
        const contactsWidget = document.querySelector('.contacts-grid-container');
        if (contactsWidget) {
            contactsWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            contactsWidget.classList.add('highlight');
        }
    }, 100);
}

// Tab Switching Function
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const targetTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (!targetTab || !targetContent) {
        console.error(`Tab or content not found for tabId: ${tabId}`);
        return;
    }

    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.transform = 'translateX(100%)';
    });

    targetTab.classList.add('active');
    targetContent.classList.add('active');
    targetContent.style.transform = 'translateX(0)';

    currentTabIndex = Array.from(tabs).findIndex(tab => tab.getAttribute('data-tab') === tabId);
    console.log(`Switched to tab: ${tabId}, new currentTabIndex: ${currentTabIndex}`);

    if (tabId === 'p2p') {
        const socket = io();
        socket.emit('requestP2PTransactionHistory');
        console.log('Requested P2P transaction history on programmatic tab switch');
    }
}

// Toast Notification System
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Import required modules
const axios = require('axios');
const cheerio = require('cheerio');

document1.addEventListener('DOMContentLoaded', () => {
    const ctx = document1.getElementById('populationGraph').getContext('2d');

    // Fetch data from the API
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            const capitals = data.capital; // Extract capitals
            const populations = data.ratings; // Extract populations

            // Create the bar graph
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: capitals,
                    datasets: [{
                        label: 'Population',
                        data: populations,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Display the data in a table
            const tableBody = document1.getElementById('data-table-body');
            capitals.forEach((capital, index) => {
                const row = document1.createElement('tr');
                const capitalCell = document1.createElement('td');
                const populationCell = document1.createElement('td');

                capitalCell.textContent = capital;
                populationCell.textContent = populations[index];

                row.appendChild(capitalCell);
                row.appendChild(populationCell);
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});


//functiont for real time updates
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('populationGraph').getContext('2d');

    // Fetch data from the API
    fetch('/api/scraped-data')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(country => country.name); // Country names
            const populations = data.map(country => country.population); // Population values

            // Create the bar graph
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Population',
                        data: populations,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // Convert current time to Mountain Time (MTD)
    const currentTime = new Date();
    const mtdTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const formattedMTDTime = mtdTime.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    console.log('Current MTD Time:', formattedMTDTime);

    // Optionally, display the MTD time in the UI
    const timeElement = document.getElementById('mtd-time');
    if (timeElement) {
        timeElement.textContent = `Current MTD Time: ${formattedMTDTime}`;
    }
});



// Chat Functionality Setup (Dashboard Widget)
function setupChat(socket) {
    let isUserAtBottom = true;

    function scrollToBottom() {
        chatBox.scrollTop = 0;
        console.log('Scrolled to top, scrollTop:', chatBox.scrollTop);
    }

    function updateStatus(messageElement, status) {
        const statusSpan = messageElement.querySelector('.status');
        if (statusSpan) statusSpan.textContent = status;
    }

    function getTimestamp() {
        const now = new Date();
        return `[${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}]`;
    }

    function createMessageElement(messageData, index) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageData.type === 'user' || messageData.type === 'file' ? 'user' : 'bot');
        messageElement.setAttribute('data-message-id', index);

        let content = '';
        if (messageData.type === 'file') {
            if (messageData.content.isImage) {
                const img = document.createElement('img');
                img.src = messageData.content.filePath;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                messageElement.appendChild(img);
                content = `Image: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            } else {
                content = `File: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            }
        } else {
            content = messageData.content;
        }

        let messageHTML = `
            <span class="username">${messageData.type === 'bot' ? 'ByteBot' : messageData.userName}</span>
            <span class="avatar"><i class="fas ${messageData.type === 'bot' ? 'fa-robot' : 'fa-user'}"></i></span>
            <span class="content">${content}</span>
            <span class="timestamp">${messageData.timestamp}</span>
            <span class="status">${messageData.status}</span>
        `;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userId === userId) {
            messageHTML += `
                <div class="message-actions">
                    ${messageData.type === 'user' ? '<button class="edit-btn action-button"><i class="fas fa-edit"></i> Edit</button>' : ''}
                    <button class="delete-btn action-button"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
        }

        messageElement.innerHTML = messageHTML;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userId === userId) {
            if (messageData.type === 'user') {
                const editBtn = messageElement.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => {
                    const newContent = prompt('Edit your message:', messageData.content);
                    if (newContent && newContent.trim() !== '') {
                        socket.emit('editMessage', { messageId: index, newContent: newContent.trim(), userId });
                    }
                });
            }

            const deleteBtn = messageElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    socket.emit('deleteMessage', { messageId: index, userId });
                }
            });
        }

        return messageElement;
    }

    const sentMessages = new Set();

    function sendMessage() {
        console.log('Sending message...');
        const message = userInput.value.trim();
        const hasFile = fileInput.files.length > 0;

        if (!message && !hasFile) {
            console.log('No message or file to send');
            return;
        }

        if (message) {
            const timestamp = getTimestamp();
            const messageId = `${userName}-${Date.now()}-${message}`;
            if (sentMessages.has(messageId)) {
                console.log('Message already sent, skipping:', messageId);
                return;
            }
            sentMessages.add(messageId);

            const messageData = {
                type: 'user',
                userName: userName,
                userId: userId,
                content: message,
                timestamp: timestamp,
                status: 'Sent',
                messageId: messageId
            };

            socket.emit('sendMessage', messageData);
            console.log('Emitted user message from Main Dashboard:', messageData);
        }

        userInput.value = '';
        scrollToBottom();
    }

    chatBox.addEventListener('scroll', () => {
        isUserAtBottom = chatBox.scrollTop === 0;
        console.log('Scroll event, isUserAtBottom:', isUserAtBottom, 'scrollTop:', chatBox.scrollTop);
    });

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            console.log('Send button clicked');
            socket.emit('stopTyping', { userName });
            sendMessage();
        });
    }

    if (userInput) {
        userInput.setAttribute('autocomplete', 'off');
        let typingTimeout;
        let isTyping = false;

        userInput.addEventListener('input', () => {
            if (!isTyping) {
                console.log(`${userName} is typing...`);
                socket.emit('typing', { userName });
                isTyping = true;
            }

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                console.log(`${userName} stopped typing.`);
                socket.emit('stopTyping', { userName });
                isTyping = false;
            }, 5000);
        });

        userInput.addEventListener('keypress', (e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'Enter') {
                console.log(`${userName} stopped typing (message sent).`);
                socket.emit('stopTyping', { userName });
                isTyping = false;
                clearTimeout(typingTimeout);
                sendMessage();
            }
        });
    }

    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            console.log('Attach button clicked');
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const timestamp = getTimestamp();
                const formData = new FormData();
                formData.append('file', file);

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) throw new Error(data.message || 'File upload failed');

                        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        const messageId = `${userName}-${timestamp}-${fileId}`;
                        if (sentMessages.has(messageId)) {
                            console.log('File message already sent, skipping:', messageId);
                            return;
                        }
                        sentMessages.add(messageId);

                        const fileData = {
                            type: 'file',
                            name: file.name,
                            path: data.filePath,
                            userName: userName,
                            userId: userId,
                            timestamp: timestamp,
                            status: 'Sent',
                            messageId: messageId
                        };

                        socket.emit('uploadFile', fileData);
                        console.log('Emitted file upload from Main Dashboard:', fileData);
                        fileInput.value = '';
                        scrollToBottom();
                    })
                    .catch(error => {
                        console.error('File upload failed:', error);
                        showToast('❌ Failed to upload file. Please try again.');
                    });
            }
        });
    }

    socket.on('chatHistory', (history) => {
        console.log('Received chat history in Main Dashboard:', history);
        chatBox.innerHTML = '';
        const p2pChatBox = document.getElementById('p2p-chat-box');
        if (p2pChatBox) p2pChatBox.innerHTML = '';
        history.forEach((msg, index) => {
            if (msg) {
                const messageElement = createMessageElement(msg, index);
                chatBox.prepend(messageElement);
                if (p2pChatBox) {
                    const p2pMessageElement = createMessageElement(msg, index);
                    p2pChatBox.prepend(p2pMessageElement);
                }
            }
        });
        scrollToBottom();
        if (p2pChatBox) p2pChatBox.scrollTop = 0;
        processedMessages.clear();
    });

    socket.on('message', (messageData, messageId) => {
        const uniqueId = messageData.messageId || `${messageData.userName}-${messageData.timestamp}-${messageData.content}`;
        if (processedMessages.has(uniqueId)) {
            console.log('Message already processed in Main Dashboard, skipping:', uniqueId);
            return;
        }
        processedMessages.add(uniqueId);
        console.log('Main Dashboard received message:', messageData, 'Message ID:', messageId);

        const messageElement = createMessageElement(messageData, messageId);
        chatBox.prepend(messageElement);

        const p2pChatBox = document.getElementById('p2p-chat-box');
        if (p2pChatBox) {
            const p2pMessageElement = createMessageElement(messageData, messageId);
            p2pChatBox.prepend(p2pMessageElement);
            p2pChatBox.scrollTop = 0;
        }

        if (messageData.type === 'user' || messageData.type === 'file') {
            setTimeout(() => updateStatus(messageElement, 'Delivered'), 1000);
            setTimeout(() => updateStatus(messageElement, 'Read'), 2000);
        }

        if (isUserAtBottom || messageData.userId === userId) {
            scrollToBottom();
        }
    });

    socket.on('messageEdited', ({ messageId, newContent }) => {
        console.log('Message edited in Main Dashboard:', messageId, newContent);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const contentSpan = messageElement.querySelector('.content');
            contentSpan.textContent = newContent;
        }
        const p2pChatBox = document.getElementById('p2p-chat-box');
        if (p2pChatBox) {
            const p2pMessageElement = p2pChatBox.querySelector(`[data-message-id="${messageId}"]`);
            if (p2pMessageElement) {
                const p2pContentSpan = p2pMessageElement.querySelector('.content');
                p2pContentSpan.textContent = newContent;
            }
        }
    });

    socket.on('messageDeleted', (messageId) => {
        console.log('Message deleted in Main Dashboard:', messageId);
        const messageElement = chatBox.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
        const p2pChatBox = document.getElementById('p2p-chat-box');
        if (p2pChatBox) {
            const p2pMessageElement = p2pChatBox.querySelector(`[data-message-id="${messageId}"]`);
            if (p2pMessageElement) {
                p2pMessageElement.remove();
            }
        }
    });

    const typingUsers = new Set();

    socket.on('userTyping', ({ userName: typingUser }) => {
        console.log(`Received userTyping event in Main Dashboard for ${typingUser}`);
        if (typingUser !== userName) {
            typingUsers.add(typingUser);
            updateTypingIndicator();
        }
    });

    socket.on('userStoppedTyping', ({ userName: typingUser }) => {
        console.log(`Received userStoppedTyping event in Main Dashboard for ${typingUser}`);
        typingUsers.delete(typingUser);
        updateTypingIndicator();
    });

    function updateTypingIndicator() {
        console.log('Updating typing indicator in Main Dashboard, typingUsers:', Array.from(typingUsers));
        let typingIndicator = chatBox.querySelector('.typing-indicator');

        if (typingUsers.size > 0) {
            const typingText = Array.from(typingUsers).join(', ') + (typingUsers.size === 1 ? ' is typing...' : ' are typing...');
            
            if (typingIndicator) {
                typingIndicator.querySelector('.content').textContent = typingText;
            } else {
                typingIndicator = document.createElement('div');
                typingIndicator.classList.add('message', 'typing-indicator');
                typingIndicator.innerHTML = `
                    <span class="avatar"><i class="fas fa-keyboard"></i></span>
                    <span class="content">${typingText}</span>
                `;
                chatBox.prepend(typingIndicator);
                console.log('Created typing indicator in Main Dashboard:', typingText);
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
                console.log('Removed typing indicator in Main Dashboard');
            }
        }

        if (isUserAtBottom) {
            scrollToBottom();
        }
    }
}

// TAB FUNCTION IN THE BYTECHAT LIVE MESSAGE WIDGET IN THE (DASHBOARD TAB)
document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            loadTabContent(tab);
        });
    });

    function loadTabContent(tab) {
        if (!chatBox) return;

        chatBox.innerHTML = '';

        if (tab === 'contacts') {
            chatBox.innerHTML = `
                <div class="contact-list">
                    <h4>Your Contacts</h4>
                    <ul>
                        <li>John Doe (ID: user123)</li>
                        <li>Jane Smith (ID: user456)</li>
                        <!-- Future: Make these dynamic -->
                    </ul>
                </div>
            `;
        } else if (tab === 'new') {
            chatBox.innerHTML = `
                <div class="new-message-form">
                    <input type="text" placeholder="Enter User ID..." class="input-id" />
                    <textarea placeholder="Type your message..." class="input-message"></textarea>
                    <button class="action-button">Send</button>
                </div>
            `;
        } else if (tab === 'messages') {
            chatBox.innerHTML = `
                <div class="message-log">
                    <p>[12:34 PM] You: Hi there!</p>
                    <p>[12:35 PM] John: Hello!</p>
                </div>
            `;
        }
    }

    loadTabContent('messages');
});

// TAB FUNCTION IN THE BYTECHAT LIVE MESSAGE WIDGET IN THE (P2P TAB)
document.addEventListener('DOMContentLoaded', () => {
    const p2pChatBox = document.getElementById('p2p-chat-box');
    const p2pTabButtons = document.querySelectorAll('.p2p-tab-btn');

    p2pTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            loadP2PTabContent(tab);
        });
    });

    function loadP2PTabContent(tab) {
        if (!p2pChatBox) return;

        p2pChatBox.innerHTML = '';

        if (tab === 'contacts') {
            p2pChatBox.innerHTML = `
                <div class="p2p-contact-list">
                    <h4>Your Contacts</h4>
                    <ul>
                        <li>John Doe (ID: user123)</li>
                        <li>Jane Smith (ID: user456)</li>
                        <!-- Future: Make these dynamic -->
                    </ul>
                </div>
            `;
        } else if (tab === 'new') {
            p2pChatBox.innerHTML = `
                <div class="p2p-new-message-form">
                    <input type="text" placeholder="Enter User ID..." class="p2p-input-id" />
                    <textarea placeholder="Type your message..." class="p2p-input-message"></textarea>
                    <button class="action-button">Send</button>
                </div>
            `;
        } else if (tab === 'messages') {
            p2pChatBox.innerHTML = `
                <div class="p2p-message-log">
                    <p>[12:34 PM] You: Hi there!</p>
                    <p>[12:35 PM] John: Hello!</p>
                </div>
            `;
        }
    }

    loadP2PTabContent('messages');
});

// P2P Chat Functionality Setup (P2P Widget)
function setupP2PChat(socket) {
    const p2pChatBox = document.getElementById('p2p-chat-box');
    const p2pUserInput = document.getElementById('p2p-user-input');
    const p2pSendBtn = document.getElementById('p2p-send-btn');
    const p2pAttachBtn = document.getElementById('p2p-attach-btn');
    const p2pFileInput = document.getElementById('p2p-file-input');
    let p2pIsUserAtBottom = true;

    function p2pScrollToBottom() {
        p2pChatBox.scrollTop = 0;
        console.log('P2P scrolled to top, scrollTop:', p2pChatBox.scrollTop);
    }

    function p2pUpdateStatus(messageElement, status) {
        const statusSpan = messageElement.querySelector('.status');
        if (statusSpan) statusSpan.textContent = status;
    }

    function p2pGetTimestamp() {
        const now = new Date();
        return `[${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}]`;
    }

    function p2pCreateMessageElement(messageData, index) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageData.type === 'user' || messageData.type === 'file' ? 'user' : 'bot');
        messageElement.setAttribute('data-message-id', index);

        let content = '';
        if (messageData.type === 'file') {
            if (messageData.content.isImage) {
                const img = document.createElement('img');
                img.src = messageData.content.filePath;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                messageElement.appendChild(img);
                content = `Image: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            } else {
                content = `File: <a href="${messageData.content.filePath}" class="file-link" data-file-id="${messageData.content.fileId}" download="${messageData.content.fileName}">${messageData.content.fileName}</a>`;
            }
        } else {
            content = messageData.content;
        }

        let messageHTML = `
            <span class="username">${messageData.type === 'bot' ? 'ByteBot' : messageData.userName}</span>
            <span class="avatar"><i class="fas ${messageData.type === 'bot' ? 'fa-robot' : 'fa-user'}"></i></span>
            <span class="content">${content}</span>
            <span class="timestamp">${messageData.timestamp}</span>
            <span class="status">${messageData.status}</span>
        `;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userId === userId) {
            messageHTML += `
                <div class="message-actions">
                    ${messageData.type === 'user' ? '<button class="edit-btn action-button"><i class="fas fa-edit"></i> Edit</button>' : ''}
                    <button class="delete-btn action-button"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
        }

        messageElement.innerHTML = messageHTML;

        if ((messageData.type === 'user' || messageData.type === 'file') && messageData.userId === userId) {
            if (messageData.type === 'user') {
                const editBtn = messageElement.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => {
                    const newContent = prompt('Edit your message:', messageData.content);
                    if (newContent && newContent.trim() !== '') {
                        socket.emit('editMessage', { messageId: index, newContent: newContent.trim(), userId });
                    }
                });
            }

            const deleteBtn = messageElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    socket.emit('deleteMessage', { messageId: index, userId });
                }
            });
        }

        return messageElement;
    }

    const sentMessages = new Set();

    function p2pSendMessage() {
        console.log('P2P sending message...');
        const message = p2pUserInput.value.trim();
        const hasFile = p2pFileInput.files.length > 0;

        if (!message && !hasFile) {
            console.log('P2P no message or file to send');
            return;
        }

        if (message) {
            const timestamp = p2pGetTimestamp();
            const messageId = `${userName}-${Date.now()}-${message}`;
            if (sentMessages.has(messageId)) {
                console.log('P2P message already sent, skipping:', messageId);
                return;
            }
            sentMessages.add(messageId);

            const messageData = {
                type: 'user',
                userName: userName,
                userId: userId,
                content: message,
                timestamp: timestamp,
                status: 'Sent',
                messageId: messageId
            };

            socket.emit('sendMessage', messageData);
            console.log('Emitted user message from P2P tab:', messageData);
        }

        p2pUserInput.value = '';
        p2pScrollToBottom();
    }

    p2pChatBox.addEventListener('scroll', () => {
        p2pIsUserAtBottom = p2pChatBox.scrollTop === 0;
        console.log('P2P scroll event, p2pIsUserAtBottom:', p2pIsUserAtBottom, 'scrollTop:', p2pChatBox.scrollTop);
    });

    if (p2pSendBtn) {
        p2pSendBtn.addEventListener('click', () => {
            console.log('P2P send button clicked');
            socket.emit('stopTyping', { userName });
            p2pSendMessage();
        });
    }

    if (p2pUserInput) {
        p2pUserInput.setAttribute('autocomplete', 'off');
        let p2pTypingTimeout;
        let p2pIsTyping = false;

        p2pUserInput.addEventListener('input', () => {
            if (!p2pIsTyping) {
                console.log(`${userName} is typing in P2P chat...`);
                socket.emit('typing', { userName });
                p2pIsTyping = true;
            }

            clearTimeout(p2pTypingTimeout);
            p2pTypingTimeout = setTimeout(() => {
                console.log(`${userName} stopped typing in P2P chat.`);
                socket.emit('stopTyping', { userName });
                p2pIsTyping = false;
            }, 5000);
        });

        p2pUserInput.addEventListener('keypress', (e) => {
            console.log('P2P key pressed:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log(`${userName} stopped typing in P2P chat (message sent).`);
                socket.emit('stopTyping', { userName });
                p2pIsTyping = false;
                clearTimeout(p2pTypingTimeout);
                p2pSendMessage();
            }
        });
    }

    if (p2pAttachBtn) {
        p2pAttachBtn.addEventListener('click', () => {
            console.log('P2P attach button clicked');
            p2pFileInput.click();
        });
    }

    if (p2pFileInput) {
        p2pFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('P2P file selected:', file.name);
                const timestamp = p2pGetTimestamp();
                const formData = new FormData();
                formData.append('file', file);

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) throw new Error(data.message || 'File upload failed');

                        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        const messageId = `${userName}-${timestamp}-${fileId}`;
                        if (sentMessages.has(messageId)) {
                            console.log('P2P file message already sent, skipping:', messageId);
                            return;
                        }
                        sentMessages.add(messageId);

                        const fileData = {
                            type: 'file',
                            name: file.name,
                            path: data.filePath,
                            userName: userName,
                            userId: userId,
                            timestamp: timestamp,
                            status: 'Sent',
                            messageId: messageId
                        };

                        socket.emit('uploadFile', fileData);
                        console.log('Emitted file upload from P2P tab:', fileData);
                        p2pFileInput.value = '';
                        p2pScrollToBottom();
                    })
                    .catch(error => {
                        console.error('P2P file upload failed:', error);
                        showToast('❌ Failed to upload file. Please try again.');
                    });
            }
        });
    }

    const p2pTypingUsers = new Set();

    socket.on('userTyping', ({ userName: typingUser }) => {
        console.log(`P2P received userTyping event for ${typingUser}`);
        if (typingUser !== userName) {
            p2pTypingUsers.add(typingUser);
            p2pUpdateTypingIndicator();
        }
    });

    socket.on('userStoppedTyping', ({ userName: typingUser }) => {
        console.log(`P2P received userStoppedTyping event for ${typingUser}`);
        p2pTypingUsers.delete(typingUser);
        p2pUpdateTypingIndicator();
    });

    function p2pUpdateTypingIndicator() {
        console.log('P2P updating typing indicator, p2pTypingUsers:', Array.from(p2pTypingUsers));
        let typingIndicator = p2pChatBox.querySelector('.typing-indicator');

        if (p2pTypingUsers.size > 0) {
            const typingText = Array.from(p2pTypingUsers).join(', ') + (p2pTypingUsers.size === 1 ? ' is typing...' : ' are typing...');
            
            if (typingIndicator) {
                typingIndicator.querySelector('.content').textContent = typingText;
            } else {
                typingIndicator = document.createElement('div');
                typingIndicator.classList.add('message', 'typing-indicator');
                typingIndicator.innerHTML = `
                    <span class="avatar"><i class="fas fa-keyboard"></i></span>
                    <span class="content">${typingText}</span>
                `;
                p2pChatBox.prepend(typingIndicator);
                console.log('P2P created typing indicator:', typingText);
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
                console.log('P2P removed typing indicator');
            }
        }

        if (p2pIsUserAtBottom) {
            p2pScrollToBottom();
        }
    }
}

// Emoji Picker Setup (Dashboard Widget)
function setupEmojiPicker() {
    const emojiCategories = {
        'Smiley & People': ['😊', '😂', '😍', '🤔', '😎', '😅', '🙃', '🤯', '🤗', '🤭', '🙄', '😡', '💀', '🤝', '👍', '👎', '🙌', '👏', '✌️'],
        'Love & Affection': ['❤️', '💕', '💞', '💔', '😘', '🥰', '😏', '💋'],
        'Actions & Gestures': ['👉', '👈', '👆', '👇', '✋', '🤙', '🖖', '🤜🤛', '🤞', '👀'],
        'Fun & Celebrations': ['🎉', '🔥', '🎂', '🍕', '🎵', '🎮', '🏆', '⚡', '🎯'],
        'Nature & Objects': ['🌍', '🌟', '☀️', '🌙', '🌈', '☕', '🍺', '🏀', '⚽'],
        'Special Chat Emojis': ['✅', '❌', '🔄', '📌', '📎', '💡']
    };

    if (emojiBtn && emojiPicker) {
        emojiPicker.innerHTML = '';
        const closeButton = document.createElement('button');
        closeButton.textContent = '✖';
        closeButton.classList.add('emoji-close-btn');
        closeButton.addEventListener('click', () => {
            emojiPicker.style.display = 'none';
            console.log('Emoji picker closed via close button');
        });
        emojiPicker.appendChild(closeButton);

        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('emoji-category-container');
        Object.keys(emojiCategories).forEach(category => {
            const tab = document.createElement('button');
            tab.textContent = category;
            tab.classList.add('emoji-tab');
            tab.addEventListener('click', () => showCategory(category));
            categoryContainer.appendChild(tab);
        });
        emojiPicker.appendChild(categoryContainer);

        let activeCategory = Object.keys(emojiCategories)[0];
        Object.keys(emojiCategories).forEach(category => {
            const emojiDiv = document.createElement('div');
            emojiDiv.classList.add('emoji-category');
            emojiDiv.style.display = category === activeCategory ? 'flex' : 'none';
            emojiCategories[category].forEach(emoji => {
                const emojiButton = document.createElement('button');
                emojiButton.textContent = emoji;
                emojiButton.classList.add('emoji-option');
                emojiButton.addEventListener('click', () => {
                    userInput.value += emoji;
                    userInput.focus();
                    emojiPicker.style.display = 'none';
                    console.log('Emoji selected:', emoji);
                });
                emojiDiv.appendChild(emojiButton);
            });
            emojiPicker.appendChild(emojiDiv);
        });

        function showCategory(category) {
            document.querySelectorAll('.emoji-category').forEach(div => div.style.display = 'none');
            document.querySelectorAll('.emoji-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector(`.emoji-category:nth-child(${Object.keys(emojiCategories).indexOf(category) + 3})`).style.display = 'flex';
            document.querySelector(`.emoji-tab:contains("${category}")`).classList.add('active');
            activeCategory = category;
            console.log('Switched to category:', category);
        }

        emojiBtn.addEventListener('click', () => {
            console.log('Emoji button clicked, toggling picker');
            const currentDisplay = window.getComputedStyle(emojiPicker).display;
            emojiPicker.style.display = currentDisplay === 'block' ? 'none' : 'block';
            console.log('Emoji picker display set to:', emojiPicker.style.display);
        });
    }
}

// Emoji Picker Setup (P2P Widget)
function setupP2PEmojiPicker() {
    const p2pEmojiPicker = document.getElementById('p2p-emoji-picker');
    const p2pEmojiBtn = document.getElementById('p2p-emoji-btn');
    const p2pUserInput = document.getElementById('p2p-user-input');

    const emojiCategories = {
        'Smiley & People': ['😊', '😂', '😍', '🤔', '😎', '😅', '🙃', '🤯', '🤗', '🤭', '🙄', '😡', '💀', '🤝', '👍', '👎', '🙌', '👏', '✌️'],
        'Love & Affection': ['❤️', '💕', '💞', '💔', '😘', '🥰', '😏', '💋'],
        'Actions & Gestures': ['👉', '👈', '👆', '👇', '✋', '🤙', '🖖', '🤜🤛', '🤞', '👀'],
        'Fun & Celebrations': ['🎉', '🔥', '🎂', '🍕', '🎵', '🎮', '🏆', '⚡', '🎯'],
        'Nature & Objects': ['🌍', '🌟', '☀️', '🌙', '🌈', '☕', '🍺', '🏀', '⚽'],
        'Special Chat Emojis': ['✅', '❌', '🔄', '📌', '📎', '💡']
    };

    if (p2pEmojiBtn && p2pEmojiPicker && p2pUserInput) {
        p2pEmojiPicker.innerHTML = '';
        const closeButton = document.createElement('button');
        closeButton.textContent = '✖';
        closeButton.classList.add('emoji-close-btn');
        closeButton.addEventListener('click', () => {
            p2pEmojiPicker.style.display = 'none';
            console.log('P2P emoji picker closed via close button');
        });
        p2pEmojiPicker.appendChild(closeButton);

        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('emoji-category-container');
        Object.keys(emojiCategories).forEach(category => {
            const tab = document.createElement('button');
            tab.textContent = category;
            tab.classList.add('emoji-tab');
            tab.addEventListener('click', () => showCategory(category));
            categoryContainer.appendChild(tab);
        });
        p2pEmojiPicker.appendChild(categoryContainer);

        let activeCategory = Object.keys(emojiCategories)[0];
        Object.keys(emojiCategories).forEach(category => {
            const emojiDiv = document.createElement('div');
            emojiDiv.classList.add('emoji-category');
            emojiDiv.style.display = category === activeCategory ? 'flex' : 'none';
            emojiCategories[category].forEach(emoji => {
                const emojiButton = document.createElement('button');
                emojiButton.textContent = emoji;
                emojiButton.classList.add('emoji-option');
                emojiButton.addEventListener('click', () => {
                    p2pUserInput.value += emoji;
                    p2pUserInput.focus();
                    p2pEmojiPicker.style.display = 'none';
                    console.log('P2P emoji selected:', emoji);
                });
                emojiDiv.appendChild(emojiButton);
            });
            p2pEmojiPicker.appendChild(emojiDiv);
        });

        function showCategory(category) {
            document.querySelectorAll('#p2p-emoji-picker .emoji-category').forEach(div => div.style.display = 'none');
            document.querySelectorAll('#p2p-emoji-picker .emoji-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector(`#p2p-emoji-picker .emoji-category:nth-child(${Object.keys(emojiCategories).indexOf(category) + 3})`).style.display = 'flex';
            document.querySelector(`#p2p-emoji-picker .emoji-tab:contains("${category}")`).classList.add('active');
            activeCategory = category;
            console.log('P2P switched to category:', category);
        }

        p2pEmojiBtn.addEventListener('click', () => {
            console.log('P2P emoji button clicked, toggling picker');
            const currentDisplay = window.getComputedStyle(p2pEmojiPicker).display;
            p2pEmojiPicker.style.display = currentDisplay === 'block' ? 'none' : 'block';
            console.log('P2P emoji picker display set to:', p2pEmojiPicker.style.display);
        });
    }
}

// Chat Expansion Setup (Dashboard Widget)
function setupChatExpansion() {
    function toggleChatExpansion() {
        isExpanded = !isExpanded;
        const chatWindow = document.querySelector('.chat-window');
        chatWindow.classList.toggle('chat-expanded');

        if (isExpanded) {
            originalParent = chatWindow.parentNode;
            placeholder = document.createElement('div');
            placeholder.classList.add('chat-placeholder');
            placeholder.style.width = window.getComputedStyle(chatWindow).width;
            placeholder.style.height = window.getComputedStyle(chatWindow).height;
            originalParent.insertBefore(placeholder, chatWindow);

            document.body.appendChild(chatWindow);
            overlay.classList.add('active');
            dashboardContainer.classList.add('blurred');
        } else {
            overlay.classList.remove('active');
            dashboardContainer.classList.remove('blurred');
            chatWindow.style.width = '';
            chatWindow.style.height = '';
            chatWindow.style.position = '';
            chatWindow.style.top = '';
            chatWindow.style.left = '';
            chatWindow.style.transform = '';
            chatWindow.style.maxWidth = '';
            chatWindow.style.maxHeight = '';
            chatWindow.style.zIndex = '';

            if (originalParent && placeholder) {
                originalParent.replaceChild(chatWindow, placeholder);
                placeholder = null;
                originalParent = null;
            }
        }

        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = 0;
    }

    if (expandButton) {
        expandButton.removeEventListener('click', toggleChatExpansion);
        expandButton.addEventListener('click', toggleChatExpansion);
    }

    if (closeButton) {
        closeButton.removeEventListener('click', toggleChatExpansion);
        closeButton.addEventListener('click', toggleChatExpansion);
    }
}

// Chat Expansion Setup (P2P Widget)
function setupP2PChatExpansion() {
    const p2pExpandButton = document.getElementById('p2p-expand-chat');
    const p2pCloseButton = document.getElementById('p2p-close-chat');
    const p2pOverlay = document.querySelector('.p2p-overlay');
    let p2pIsExpanded = false;
    let p2pOriginalParent = null;
    let p2pPlaceholder = null;

    function p2pToggleChatExpansion() {
        p2pIsExpanded = !p2pIsExpanded;
        const p2pChatWindow = document.querySelector('.p2p-chat-window');
        p2pChatWindow.classList.toggle('p2p-chat-expanded');

        if (p2pIsExpanded) {
            p2pOriginalParent = p2pChatWindow.parentNode;
            p2pPlaceholder = document.createElement('div');
            p2pPlaceholder.classList.add('chat-placeholder');
            p2pPlaceholder.style.width = window.getComputedStyle(p2pChatWindow).width;
            p2pPlaceholder.style.height = window.getComputedStyle(p2pChatWindow).height;
            p2pOriginalParent.insertBefore(p2pPlaceholder, p2pChatWindow);

            document.body.appendChild(p2pChatWindow);
            p2pOverlay.classList.add('active');
            dashboardContainer.classList.add('blurred');
        } else {
            p2pOverlay.classList.remove('active');
            dashboardContainer.classList.remove('blurred');
            p2pChatWindow.style.width = '';
            p2pChatWindow.style.height = '';
            p2pChatWindow.style.position = '';
            p2pChatWindow.style.top = '';
            p2pChatWindow.style.left = '';
            p2pChatWindow.style.transform = '';
            p2pChatWindow.style.maxWidth = '';
            p2pChatWindow.style.maxHeight = '';
            p2pChatWindow.style.zIndex = '';

            if (p2pOriginalParent && p2pPlaceholder) {
                p2pOriginalParent.replaceChild(p2pChatWindow, p2pPlaceholder);
                p2pPlaceholder = null;
                p2pOriginalParent = null;
            }
        }

        const p2pChatBox = document.getElementById('p2p-chat-box');
        p2pChatBox.scrollTop = 0;
    }

    if (p2pExpandButton) {
        p2pExpandButton.removeEventListener('click', p2pToggleChatExpansion);
        p2pExpandButton.addEventListener('click', p2pToggleChatExpansion);
    }

    if (p2pCloseButton) {
        p2pCloseButton.removeEventListener('click', p2pToggleChatExpansion);
        p2pCloseButton.addEventListener('click', p2pToggleChatExpansion);
    }
}

// Quick Access Tools Setup
function setupQuickAccessTools() {
    const tips = [
        "Use the 'Attach' button to share files in real time.",
        "Type /help in chat for a list of commands.",
        "You can double-click a message to edit it.",
        "Use keyboard shortcuts to speed up your support!"
    ];

    if (contactSupport) {
        contactSupport.addEventListener('click', () => {
            showToast('📩 This would open a direct support chat.');
        });
    }

    if (readDocs) {
        readDocs.addEventListener('click', () => {
            showToast('📚 Documentation coming soon.');
        });
    }

    if (resetSession) {
        resetSession.addEventListener('click', () => {
            showToast('🧼 Session has been reset successfully!');
        });
    }

    if (clearCache) {
        clearCache.addEventListener('click', () => {
            showToast('🗑️ Cache has been cleared successfully!');
        });
    }

    if (reconnectNetwork) {
        reconnectNetwork.addEventListener('click', () => {
            showToast('🌐 Network has been reconnected successfully!');
        });
    }

    if (purgeHistory) {
        purgeHistory.addEventListener('click', () => {
            showToast('🔥 History has been purged successfully!');
        });
    }

    if (refreshTips) {
        refreshTips.addEventListener('click', () => {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            document.getElementById('tipText').textContent = randomTip;
            showToast('💡 Tip refreshed!');
        });
    }
}

// Theme Toggle Setup
function setupThemeToggle() {
    if (themeToggle) {
        const skeuomorphicTheme = document.getElementById('skeuomorphic-theme');
        const frostedTheme = document.getElementById('frosted-theme');
        let isSkeuomorphic = true;

        themeToggle.addEventListener('click', () => {
            if (isSkeuomorphic) {
                skeuomorphicTheme.disabled = true;
                frostedTheme.disabled = false;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Skeuomorphic Theme';
            } else {
                skeuomorphicTheme.disabled = false;
                frostedTheme.disabled = true;
                themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Frosted Theme';
            }
            isSkeuomorphic = !isSkeuomorphic;
            localStorage.setItem('theme', isSkeuomorphic ? 'skeuomorphic' : 'frosted');
        });

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'frosted') {
            skeuomorphicTheme.disabled = true;
            frostedTheme.disabled = false;
            themeToggle.innerHTML = '<i class="fas fa-adjust"></i> Skeuomorphic Theme';
            isSkeuomorphic = false;
        }
    }
}

// FAQ and Q&A Setup
function setupFaqAndQna() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    const qnaCards = document.querySelectorAll('.qna-card, .p2p-qna-card');
    qnaCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
}

// Chatbot Support Setup
function setupChatbotSupport() {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const personality = option.getAttribute('data-personality');
            console.log(`Chatbot personality set to: ${personality}`);
        });
    });
}

// Support Analytics Setup
function setupSupportAnalytics() {
    const responseTimes = [40, 50, 30, 60, 45, 55, 35];
    const bars = document.querySelectorAll('.response-time-graph .bar');
    bars.forEach((bar, index) => {
        bar.style.setProperty('--bar-height', `${responseTimes[index]}%`);
        bar.textContent = `${responseTimes[index]} min`;
    });

    const openTicketsElement = document.getElementById('open-tickets');
    const resolvedTicketsElement = document.getElementById('resolved-tickets');
    const ticketsInQueue = 5;
    const ticketsResolved = 3;

    if (openTicketsElement && resolvedTicketsElement) {
        openTicketsElement.textContent = ticketsInQueue;
        resolvedTicketsElement.textContent = ticketsResolved;
    }

    const circle1 = document.getElementById('circle-1');
    const circle2 = document.getElementById('circle-2');
    const circle3 = document.getElementById('circle-3');

    const metrics = {
        resolutionRate: 75,
        responseTime: 62.5,
        satisfactionRate: 50
    };

    if (circle1 && circle2 && circle3) {
        circle1.style.setProperty('--percent', `${metrics.resolutionRate}%`);
        circle1.querySelector('.circle-label').textContent = `${metrics.resolutionRate}%`;
        circle2.style.setProperty('--percent', `${metrics.responseTime}%`);
        circle2.querySelector('.circle-label').textContent = `${metrics.responseTime}%`;
        circle3.style.setProperty('--percent', `${metrics.satisfactionRate}%`);
        circle3.querySelector('.circle-label').textContent = `${metrics.satisfactionRate}%`;
    }
}

// P2P Transfer Functionality
function setupP2PTransfer(socket) {
    function addTransaction(type, amount, peer, note, transactionId, status = 'completed') {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            const li = document.createElement('li');
            li.classList.add(type);
            if (status === 'pending') li.classList.add('pending');
            li.setAttribute('data-transaction-id', transactionId);

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const user = userName || 'User';
            const line1 = document.createElement('span');
            line1.classList.add('transaction-line-1');
            const line2 = document.createElement('span');
            line2.classList.add('transaction-line-2');

            if (type === 'sent') {
                line1.textContent = `${user} sent $${amount} to ${peer} at ${time}`;
                line2.textContent = `$${amount} sent to ${peer} – ${time}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'received') {
                line1.textContent = `${user} received $${amount} from ${peer} at ${time}`;
                line2.textContent = `$${amount} received from ${peer} – ${time}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'requested') {
                line1.textContent = `${user} requested $${amount} from ${peer} at ${time}`;
                line2.textContent = `$${amount} requested from ${peer} – ${time}${note ? ` [Note: ${note}]` : ''} (${status})`;
            } else if (type === 'request-received') {
                line1.textContent = `${peer} requested $${amount} from ${user} at ${time}`;
                line2.textContent = `$${amount} requested by ${peer} – ${time}${note ? ` [Note: ${note}]` : ''} (${status})`;
                if (status === 'pending') {
                    const approveBtn = document.createElement('button');
                    approveBtn.classList.add('approve-btn');
                    approveBtn.textContent = 'Approve';
                    const declineBtn = document.createElement('button');
                    declineBtn.classList.add('decline-btn');
                    declineBtn.textContent = 'Decline';
                    approveBtn.addEventListener('click', () => {
                        socket.emit('approveRequest', { transactionId, userId, peer, amount });
                    });
                    declineBtn.addEventListener('click', () => {
                        socket.emit('declineRequest', { transactionId, userId, peer });
                    });
                    li.appendChild(approveBtn);
                    li.appendChild(declineBtn);
                }
            }

            li.appendChild(line1);
            li.appendChild(line2);
            transactionList.prepend(li);

            const transaction = { type, amount, peer, note, timestamp: time, userName, userId, date: new Date().toISOString(), transactionId, status };
            socket.emit('addP2PTransaction', transaction);
            console.log('Emitted addP2PTransaction:', transaction);

            lastLocalTransactionId = transactionId;

            if (!pendingTransactions.some(t => t.transactionId === transactionId)) {
                pendingTransactions.unshift(transaction);
                console.log('Added to pendingTransactions:', pendingTransactions);
            }

            autoscrollTransactionList();
        }
    }

    function updateP2PPreview() {
        const previewList = document.querySelector('.p2p-preview ul#p2p-preview-transaction-list');
        if (previewList) {
            previewList.innerHTML = '';
            const sortedTransactions = [...pendingTransactions].sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : parseTime(a.timestamp || '12:00 AM');
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : parseTime(b.timestamp || '12:00 AM');
                return dateB - dateA;
            });

            const recentTransactions = sortedTransactions.slice(0, 5);
            recentTransactions.forEach(({ type, amount, peer, note, timestamp, userName: storedUserName, status }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                if (status === 'pending') li.classList.add('pending');
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                const user = storedUserName || 'User';
                if (type === 'sent') {
                    line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'received') {
                    line1.textContent = `${user} received $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} received from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'requested') {
                    line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                } else if (type === 'request-received') {
                    line1.textContent = `${peer} requested $${amount} from ${user} at ${timestamp}`;
                    line2.textContent = `$${amount} requested by ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                }
                li.appendChild(line1);
                li.appendChild(line2);
                previewList.appendChild(li);
            });
            console.log('Updated P2P preview with transactions:', recentTransactions);
        }
    }

    function autoscrollTransactionList() {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const scrollHeight = transactionList.scrollHeight;
                        const clientHeight = transactionList.clientHeight;
                        const maxScrollTop = scrollHeight - clientHeight;

                        if (maxScrollTop > 0) {
                            transactionList.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    });
                });
            }, 100);
        }
    }

    function parseTime(timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
        if (!timeMatch) return new Date(0);
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    function loadTransactions(history) {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            transactionList.innerHTML = '';
            history.sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : parseTime(a.timestamp || '12:00 AM');
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : parseTime(b.timestamp || '12:00 AM');
                return dateB - dateA;
            });

            history.reverse().forEach(({ type, amount, peer, note, timestamp, userName: storedUserName, transactionId, status }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                if (status === 'pending') li.classList.add('pending');
                li.setAttribute('data-transaction-id', transactionId);
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                const user = storedUserName || 'User';
                if (type === 'sent') {
                    line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'received') {
                    line1.textContent = `${user} received $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} received from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'requested') {
                    line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                } else if (type === 'request-received') {
                    line1.textContent = `${peer} requested $${amount} from ${user} at ${timestamp}`;
                    line2.textContent = `$${amount} requested by ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                    if (status === 'pending') {
                        const approveBtn = document.createElement('button');
                        approveBtn.classList.add('approve-btn');
                        approveBtn.textContent = 'Approve';
                        const declineBtn = document.createElement('button');
                        declineBtn.classList.add('decline-btn');
                        declineBtn.textContent = 'Decline';
                        approveBtn.addEventListener('click', () => {
                            socket.emit('approveRequest', { transactionId, userId, peer, amount });
                        });
                        declineBtn.addEventListener('click', () => {
                            socket.emit('declineRequest', { transactionId, userId, peer });
                        });
                        li.appendChild(approveBtn);
                        li.appendChild(declineBtn);
                    }
                }
                li.appendChild(line1);
                li.appendChild(line2);
                transactionList.prepend(li);
            });
            autoscrollTransactionList();
        } else {
            pendingTransactions = history;
        }
    }

    function addTransactionToDOM(transaction, retryCount = 0) {
        const maxRetries = 5;
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            const { type, amount, peer, note, timestamp, userName: storedUserName, transactionId, status } = transaction;
            const li = document.createElement('li');
            li.classList.add(type);
            if (status === 'pending') li.classList.add('pending');
            li.setAttribute('data-transaction-id', transactionId);
            const line1 = document.createElement('span');
            line1.classList.add('transaction-line-1');
            const line2 = document.createElement('span');
            line2.classList.add('transaction-line-2');
            const user = storedUserName || 'User';
            if (type === 'sent') {
                line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'received') {
                line1.textContent = `${user} received $${amount} from ${peer} at ${timestamp}`;
                line2.textContent = `$${amount} received from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
            } else if (type === 'requested') {
                line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
            } else if (type === 'request-received') {
                line1.textContent = `${peer} requested $${amount} from ${user} at ${timestamp}`;
                line2.textContent = `$${amount} requested by ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                if (status === 'pending') {
                    const approveBtn = document.createElement('button');
                    approveBtn.classList.add('approve-btn');
                    approveBtn.textContent = 'Approve';
                    const declineBtn = document.createElement('button');
                    declineBtn.classList.add('decline-btn');
                    declineBtn.textContent = 'Decline';
                    approveBtn.addEventListener('click', () => {
                        socket.emit('approveRequest', { transactionId, userId, peer, amount });
                    });
                    declineBtn.addEventListener('click', () => {
                        socket.emit('declineRequest', { transactionId, userId, peer });
                    });
                    li.appendChild(approveBtn);
                    li.appendChild(declineBtn);
                }
            }
            li.appendChild(line1);
            li.appendChild(line2);
            transactionList.prepend(li);
            autoscrollTransactionList();
        } else if (retryCount < maxRetries) {
            setTimeout(() => addTransactionToDOM(transaction, retryCount + 1), 500);
        } else {
            pendingTransactions.unshift(transaction);
        }
    }

    function forceRenderTransactions() {
        const transactionList = document.querySelector('ul#transaction-list');
        if (transactionList) {
            transactionList.innerHTML = '';
            pendingTransactions.sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : parseTime(a.timestamp || '12:00 AM');
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : parseTime(b.timestamp || '12:00 AM');
                return dateB - dateA;
            });

            pendingTransactions.forEach(({ type, amount, peer, note, timestamp, userName: storedUserName, transactionId, status }) => {
                const li = document.createElement('li');
                li.classList.add(type);
                if (status === 'pending') li.classList.add('pending');
                li.setAttribute('data-transaction-id', transactionId);
                const line1 = document.createElement('span');
                line1.classList.add('transaction-line-1');
                const line2 = document.createElement('span');
                line2.classList.add('transaction-line-2');
                const user = storedUserName || 'User';
                if (type === 'sent') {
                    line1.textContent = `${user} sent $${amount} to ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} sent to ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'received') {
                    line1.textContent = `${user} received $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} received from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''}`;
                } else if (type === 'requested') {
                    line1.textContent = `${user} requested $${amount} from ${peer} at ${timestamp}`;
                    line2.textContent = `$${amount} requested from ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                } else if (type === 'request-received') {
                    line1.textContent = `${peer} requested $${amount} from ${user} at ${timestamp}`;
                    line2.textContent = `$${amount} requested by ${peer} – ${timestamp}${note ? ` [Note: ${note}]` : ''} (${status})`;
                    if (status === 'pending') {
                        const approveBtn = document.createElement('button');
                        approveBtn.classList.add('approve-btn');
                        approveBtn.textContent = 'Approve';
                        const declineBtn = document.createElement('button');
                        declineBtn.classList.add('decline-btn');
                        declineBtn.textContent = 'Decline';
                        approveBtn.addEventListener('click', () => {
                            socket.emit('approveRequest', { transactionId, userId, peer, amount });
                        });
                        declineBtn.addEventListener('click', () => {
                            socket.emit('declineRequest', { transactionId, userId, peer });
                        });
                        li.appendChild(approveBtn);
                        li.appendChild(declineBtn);
                    }
                }
                li.appendChild(line1);
                li.appendChild(line2);
                transactionList.prepend(li);
            });
            autoscrollTransactionList();
        }
    }
    
    // DOM Elements for P2P Transfer Form
    const sendMoneyBtn = document.querySelector('.p2p-send-button');
    const cancelBtn = document.querySelector('.form-buttons .cancel-button');
    const requestBtn = document.querySelector('.request-button');
    const amountInput = document.querySelector('.amount-input');
    const peerSelect = document.querySelector('.peer-select');
    const noteInput = document.querySelector('.note-input');
    const confirmationPrompt = document.querySelector('#confirmation-prompt');
    const confirmationMessage = document.querySelector('#confirmation-message');
    const confirmButton = document.querySelector('.confirmation-prompt .confirm-button');
    const cancelPromptButton = document.querySelector('.confirmation-prompt .cancel-button');
    const transactionLog = document.querySelector('.transaction-log');
    const p2pToast = document.querySelector('#p2p-toast');
    const toastMessage = document.querySelector('#toast-message');
    const closeToast = document.querySelector('.close-toast');
    const requestPrompt = document.querySelector('#request-prompt');
    const requestMessage = document.querySelector('#request-message');
    const requestAmountInput = document.querySelector('.request-amount-input');
    const requestNoteInput = document.querySelector('.request-note-input');
    const requestConfirmButton = document.querySelector('.request-prompt .request-confirm-button');
    const requestCancelButton = document.querySelector('.request-prompt .request-cancel-button');

    function populatePeerSelect(contacts) {
        if (!peerSelect) return;
        peerSelect.innerHTML = '<option value="">Select a peer...</option>';
        contacts.forEach(contact => {
            const option = document.createElement('option');
            option.value = contact.username;
            option.textContent = `${contact.username} (${contact.status})`;
            peerSelect.appendChild(option);
        });
    }

    if (sendMoneyBtn && cancelBtn && requestBtn && amountInput && peerSelect && noteInput && confirmationPrompt && confirmationMessage && confirmButton && cancelPromptButton && transactionLog && p2pToast && toastMessage && closeToast && requestPrompt && requestMessage && requestAmountInput && requestNoteInput && requestConfirmButton && requestCancelButton) {
        amountInput.setAttribute('autocomplete', 'off');
        noteInput.setAttribute('autocomplete', 'off');
        requestAmountInput.setAttribute('autocomplete', 'off');
        requestNoteInput.setAttribute('autocomplete', 'off');

        socket.on('contactsList', (contacts) => {
            const currentActiveTab = document.querySelector('.tab.active');
            if (currentActiveTab && currentActiveTab.getAttribute('data-tab') === 'p2p') {
                populatePeerSelect(contacts);
            }
        });

        socket.on('newContact', (contact) => {
            const currentActiveTab = document.querySelector('.tab.active');
            if (currentActiveTab && currentActiveTab.getAttribute('data-tab') === 'p2p') {
                socket.emit('requestContacts');
            }
        });

        sendMoneyBtn.addEventListener('click', () => {
            const amount = parseFloat(amountInput.value);
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to send money to.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            if (amount > userBalance) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Insufficient balance.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            confirmationMessage.textContent = `Are you sure you want to send $${amount.toFixed(2)} to ${peer}?`;
            confirmationPrompt.classList.add('show');
        });

        confirmButton.addEventListener('click', () => {
            const amount = parseFloat(amountInput.value);
            const peer = peerSelect.value;
            const note = noteInput.value.trim();

            confirmationPrompt.classList.remove('show');

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const transactionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const transactionData = {
                userName: userName,
                userId: userId,
                peer: peer,
                amount: amount,
                timestamp: timestamp,
                note: note,
                transactionId: transactionId
            };

            socket.emit('sendMoney', transactionData);

            amountInput.value = '';
            noteInput.value = '';
        });

        cancelPromptButton.addEventListener('click', () => {
            confirmationPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Transaction cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
        });

        cancelBtn.addEventListener('click', () => {
            amountInput.value = '';
            noteInput.value = '';
            peerSelect.value = '';
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Form reset.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
        });

        requestBtn.addEventListener('click', () => {
            const peer = peerSelect.value;

            if (!peer) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please select a peer to request payment from.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            requestMessage.textContent = `Request payment from ${peer}`;
            requestPrompt.classList.add('show');
        });

        requestConfirmButton.addEventListener('click', () => {
            const amount = parseFloat(requestAmountInput.value);
            const note = requestNoteInput.value.trim();
            const peer = peerSelect.value;

            if (isNaN(amount) || amount <= 0) {
                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = '❌ Please enter a valid amount greater than 0.';
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
                return;
            }

            requestPrompt.classList.remove('show');

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const transactionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const requestData = {
                userName: userName,
                userId: userId,
                peer: peer,
                amount: amount,
                note: note,
                timestamp: timestamp,
                transactionId: transactionId,
                status: 'pending'
            };

            socket.emit('requestPayment', requestData);

            requestAmountInput.value = '';
            requestNoteInput.value = '';
        });

        requestCancelButton.addEventListener('click', () => {
            requestPrompt.classList.remove('show');
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = '❌ Payment request cancelled.';
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            requestAmountInput.value = '';
            requestNoteInput.value = '';
        });

        closeToast.addEventListener('click', () => {
            p2pToast.classList.remove('show');
        });

        function requestTransactionHistory() {
            socket.emit('requestP2PTransactionHistory');
        }

        const debouncedLoadTransactions = debounce(loadTransactions, 500);

        socket.on('p2pTransactionHistory', (history) => {
            pendingTransactions = [...history].sort((a, b) => {
                let dateA = a.date && !isNaN(new Date(a.date)) ? new Date(a.date) : parseTime(a.timestamp || '12:00 AM');
                let dateB = b.date && !isNaN(new Date(b.date)) ? new Date(b.date) : parseTime(b.timestamp || '12:00 AM');
                return dateB - dateA;
            });
            updateP2PPreview();
            debouncedLoadTransactions(history);
        });

        socket.on('newP2PTransaction', (transaction) => {
            if (transaction.transactionId === lastLocalTransactionId) return;
            if (!pendingTransactions.some(t => t.transactionId === transaction.transactionId)) {
                pendingTransactions.unshift(transaction);
                updateP2PPreview();
                const activeTab = document.querySelector('.tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
                    addTransactionToDOM(transaction);
                }
            }
        });

        socket.on('moneySent', (transactionData) => {
            p2pToast.className = 'p2p-toast success';
            toastMessage.textContent = `💸 Successfully sent $${transactionData.amount.toFixed(2)} to ${transactionData.peer}!`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            const balanceDisplay = document.querySelector('.balance-amount');
            socket.on('userBalance', ({ balance }) => {
                userBalance = balance;
                if (balanceDisplay) {
                    balanceDisplay.textContent = `$${userBalance.toFixed(2)}`;
                }
            });
            socket.emit('requestBalance');
        });

        socket.on('paymentRequested', (requestData) => {
            p2pToast.className = 'p2p-toast request';
            toastMessage.textContent = `📩 Payment request of $${requestData.amount.toFixed(2)} sent to ${requestData.peer}!`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
        });

        socket.on('requestReceived', (requestData) => {
            p2pToast.className = 'p2p-toast request';
            toastMessage.textContent = `📩 ${requestData.userName} requested $${requestData.amount.toFixed(2)} from you!`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);

            if (!pendingTransactions.some(t => t.transactionId === requestData.transactionId)) {
                pendingTransactions.unshift({
                    type: 'request-received',
                    amount: requestData.amount,
                    peer: requestData.userName,
                    note: requestData.note,
                    timestamp: requestData.timestamp,
                    userName: userName,
                    userId: userId,
                    date: new Date().toISOString(),
                    transactionId: requestData.transactionId,
                    status: 'pending'
                });
                updateP2PPreview();
                const activeTab = document.querySelector('.tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
                    addTransactionToDOM({
                        type: 'request-received',
                        amount: requestData.amount,
                        peer: requestData.userName,
                        note: requestData.note,
                        timestamp: requestData.timestamp,
                        userName: userName,
                        userId: userId,
                        date: new Date().toISOString(),
                        transactionId: requestData.transactionId,
                        status: 'pending'
                    });
                }
            }
        });

        socket.on('requestApproved', ({ transactionId, userId: senderId, peer, amount }) => {
            const transaction = pendingTransactions.find(t => t.transactionId === transactionId);
            if (transaction) {
                transaction.status = 'completed';
                const transactionElement = document.querySelector(`[data-transaction-id="${transactionId}"]`);
                if (transactionElement) {
                    transactionElement.classList.remove('pending');
                    const line2 = transactionElement.querySelector('.transaction-line-2');
                    line2.textContent = line2.textContent.replace(' (pending)', '');
                    const buttons = transactionElement.querySelectorAll('.approve-btn, .decline-btn');
                    buttons.forEach(btn => btn.remove());
                }

                const sentTransaction = {
                    type: 'sent',
                    amount: amount,
                    peer: peer,
                    note: transaction.note,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    userName: userName,
                    userId: userId,
                    date: new Date().toISOString(),
                    transactionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    status: 'completed'
                };
                const receivedTransaction = {
                    type: 'received',
                    amount: amount,
                    peer: userName,
                    note: transaction.note,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    userName: peer,
                    userId: senderId,
                    date: new Date().toISOString(),
                    transactionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    status: 'completed'
                };

                pendingTransactions.unshift(sentTransaction);
                pendingTransactions.unshift(receivedTransaction);
                updateP2PPreview();

                const activeTab = document.querySelector('.tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
                    addTransactionToDOM(sentTransaction);
                }

                p2pToast.className = 'p2p-toast success';
                toastMessage.textContent = `✅ You approved a payment of $${amount.toFixed(2)} to ${peer}!`;
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);

                const balanceDisplay = document.querySelector('.balance-amount');
                socket.on('userBalance', ({ balance }) => {
                    userBalance = balance;
                    if (balanceDisplay) {
                        balanceDisplay.textContent = `$${userBalance.toFixed(2)}`;
                    }
                });
                socket.emit('requestBalance');
            }
        });

        socket.on('requestDeclined', ({ transactionId, peer }) => {
            const transaction = pendingTransactions.find(t => t.transactionId === transactionId);
            if (transaction) {
                transaction.status = 'declined';
                const transactionElement = document.querySelector(`[data-transaction-id="${transactionId}"]`);
                if (transactionElement) {
                    transactionElement.classList.remove('pending');
                    const line2 = transactionElement.querySelector('.transaction-line-2');
                    line2.textContent = line2.textContent.replace(' (pending)', ' (declined)');
                    const buttons = transactionElement.querySelectorAll('.approve-btn, .decline-btn');
                    buttons.forEach(btn => btn.remove());
                }

                p2pToast.className = 'p2p-toast cancel';
                toastMessage.textContent = `❌ You declined a payment request of $${transaction.amount.toFixed(2)} from ${peer}.`;
                p2pToast.classList.add('show');
                setTimeout(() => p2pToast.classList.remove('show'), 3000);
            }
        });

        socket.on('transactionError', ({ message }) => {
            p2pToast.className = 'p2p-toast cancel';
            toastMessage.textContent = `❌ ${message}`;
            p2pToast.classList.add('show');
            setTimeout(() => p2pToast.classList.remove('show'), 3000);
        });

        socket.on('connect', () => {
            requestTransactionHistory();
        });

        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                if (tabId === 'p2p') {
                    requestTransactionHistory();
                    setTimeout(forceRenderTransactions, 500);
                }
            });
        });

        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
            requestTransactionHistory();
        }
    }
}

// Contacts Functionality Setup
function setupContacts(socket) {
    const addContactBtn = document.getElementById('add-contact-btn');
    const contactUsernameInput = document.getElementById('contact-username');
    const contactsList = document.getElementById('contacts-list');

    function requestContacts() {
        socket.emit('requestContacts');
    }

    function displayContacts(contacts) {
        contactsList.innerHTML = '';
        contacts.forEach(contact => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${contact.username} (ID: ${contact.contactId})</span>
                <span class="contact-status ${contact.status}">${contact.status}</span>
            `;
            contactsList.appendChild(li);
        });
    }

    socket.on('contactsList', (contacts) => {
        displayContacts(contacts);
    });

    socket.on('newContact', (contact) => {
        const currentContacts = Array.from(contactsList.children).map(li => {
            const username = li.querySelector('span').textContent.split(' (ID: ')[0];
            const contactId = li.querySelector('span').textContent.match(/ID: (.*?)\)/)[1];
            const status = li.querySelector('.contact-status').textContent;
            return { username, contactId, status };
        });
        currentContacts.push(contact);
        displayContacts(currentContacts);
    });

    if (addContactBtn && contactUsernameInput) {
        addContactBtn.addEventListener('click', () => {
            const username = contactUsernameInput.value.trim();
            if (!username) {
                showToast('❌ Please enter a username.', 3000);
                return;
            }

            socket.emit('addContact', { username }, (response) => {
                if (response.success) {
                    showToast(`✅ ${response.message}`, 3000);
                    contactUsernameInput.value = '';
                } else {
                    showToast(`❌ ${response.message}`, 3000);
                }
            });
        });

        contactUsernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addContactBtn.click();
            }
        });
    }

    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'p2p') {
        requestContacts();
    }

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId === 'p2p') {
                requestContacts();
            }
        });
    });
}

function setupContactsPreview(socket) {
    const contactsPreviewList = document.getElementById('contacts-preview-list');
    if (!contactsPreviewList) return;

    function requestContactsPreview() {
        socket.emit('requestContacts');
    }

    socket.on('contactsList', (contacts) => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') !== 'dashboard') return;

        contactsPreviewList.innerHTML = '';
        if (contacts.length === 0) {
            const li = document.createElement('li');
            li.className = 'no-contacts';
            li.textContent = 'No contacts yet.';
            contactsPreviewList.appendChild(li);
            return;
        }

        const previewContacts = contacts.slice(0, 4);
        previewContacts.forEach(contact => {
            const li = document.createElement('li');
            li.className = `contact-item ${contact.status}`;
            li.textContent = `${contact.username} - ${contact.status}`;
            contactsPreviewList.appendChild(li);
        });
    });

    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'dashboard') {
        requestContactsPreview();
    }

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId === 'dashboard') {
                requestContactsPreview();
            }
        });
    });

    socket.on('newContact', (contact) => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'dashboard') {
            requestContactsPreview();
        }
    });
}

// Bot Chat Functionality
function setupBotChats(socket) {
    const botChatBox = document.getElementById('bot-chat-box');
    const botUserInput = document.getElementById('bot-user-input');
    const botSendBtn = document.getElementById('bot-send-btn');

    const qnaBotChatBox = document.getElementById('qna-bot-chat-box');
    const qnaBotUserInput = document.getElementById('qna-bot-user-input');
    const qnaBotSendBtn = document.getElementById('qna-bot-send-btn');

    let conversationState = 'initial';

    function addBotMessage(content) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const message = document.createElement('div');
        message.classList.add('message', 'bot');
        message.innerHTML = `
            <span class="username">ByteBot</span>
            <span class="content">${content}</span>
            <span class="timestamp">[${timestamp}]</span>
        `;

        if (botChatBox) {
            botChatBox.appendChild(message.cloneNode(true));
            botChatBox.scrollTop = botChatBox.scrollHeight;
        }
        if (qnaBotChatBox) {
            qnaBotChatBox.appendChild(message.cloneNode(true));
            qnaBotChatBox.scrollTop = qnaBotChatBox.scrollHeight;
        }
    }

    function addUserMessage(content) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const message = document.createElement('div');
        message.classList.add('message', 'user');
        message.innerHTML = `
            <span class="username">You</span>
            <span class="content">${content}</span>
            <span class="timestamp">[${timestamp}]</span>
        `;

        if (botChatBox) {
            botChatBox.appendChild(message.cloneNode(true));
            botChatBox.scrollTop = botChatBox.scrollHeight;
        }
        if (qnaBotChatBox) {
            qnaBotChatBox.appendChild(message.cloneNode(true));
            qnaBotChatBox.scrollTop = qnaBotChatBox.scrollHeight;
        }
    }

    function handleBotResponse(userMessage) {
        userMessage = userMessage.toLowerCase();
        let response = '';

        if (conversationState === 'initial') {
            if (userMessage.includes('password')) {
                response = 'To reset your password, go to Settings > Account > Reset Password. Does that help?';
                conversationState = 'password';
            } else if (userMessage.includes('support') || userMessage.includes('help')) {
                response = 'I can help with common issues, or you can contact support. What’s your question?';
                conversationState = 'support';
            } else {
                response = 'I’m not sure I understand. Can you ask about something specific, like password reset or support?';
            }
        } else if (conversationState === 'password') {
            if (userMessage.includes('yes')) {
                response = 'Great! If you need help with anything else, just ask.';
                conversationState = 'initial';
            } else {
                response = 'I’m sorry that didn’t help. Would you like to escalate to Live Chat or open a Ticket?';
                conversationState = 'escalate';
            }
        } else if (conversationState === 'support') {
            response = 'You can contact support via Live Chat or by opening a Ticket. Would you like to escalate to Live Chat or open a Ticket?';
            conversationState = 'escalate';
        } else if (conversationState === 'escalate') {
            if (userMessage.includes('live chat')) {
                response = 'Switching you to Live Chat...';
                setTimeout(() => switchTab('dashboard'), 1000);
            } else if (userMessage.includes('ticket')) {
                response = 'Opening a Ticket for you...';
                setTimeout(() => switchTab('dashboard'), 1000);
            } else {
                response = 'Please choose: Live Chat or Ticket?';
            }
        }

        setTimeout(() => addBotMessage(response), 500);
    }

    addBotMessage('Welcome! This chat is for help and support. Hello! How can I assist you today?');

    if (botSendBtn) {
        botSendBtn.addEventListener('click', () => {
            const message = botUserInput.value.trim();
            if (message) {
                addUserMessage(message);
                handleBotResponse(message);
                botUserInput.value = '';
            }
        });
    }

    if (botUserInput) {
        botUserInput.setAttribute('autocomplete', 'off');
        botUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                botSendBtn.click();
            }
        });
    }

    if (qnaBotSendBtn) {
        qnaBotSendBtn.addEventListener('click', () => {
            const message = qnaBotUserInput.value.trim();
            if (message) {
                addUserMessage(message);
                handleBotResponse(message);
                qnaBotUserInput.value = '';
            }
        });
    }

    if (qnaBotUserInput) {
        qnaBotUserInput.setAttribute('autocomplete', 'off');
        qnaBotUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                qnaBotSendBtn.click();
            }
        });
    }
}

// View Buttons Setup
function setupViewButtons() {
    const viewAllFaqsBtn = document.querySelector('.view-all-faqs');
    if (viewAllFaqsBtn) {
        viewAllFaqsBtn.addEventListener('click', () => {
            const tabId = viewAllFaqsBtn.getAttribute('data-tab') || 'qna';
            switchTab(tabId);
            setTimeout(() => {
                const targetWidget = document.querySelector('#qna .qna-grid-container');
                if (targetWidget) {
                    targetWidget.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });
    }

    const viewMoreP2PBtn = document.querySelector('.view-more-p2p');
    if (viewMoreP2PBtn) {
        viewMoreP2PBtn.addEventListener('click', () => {
            switchTab('p2p');
            setTimeout(() => {
                const targetWidget = document.querySelector('.active-p2p-connections .transaction-log');
                if (targetWidget) {
                    targetWidget.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });
    }

    const viewAllContactsBtn = document.querySelector('.view-all-contacts');
    if (viewAllContactsBtn) {
        viewAllContactsBtn.addEventListener('click', () => {
            viewAllContacts();
        });
    }
}

// Bar Graph Setup
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('populationGraph').getContext('2d');

    // Fetch data from the API
    fetch('/api/scraped-data')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(country => country.name);
            const populations = data.map(country => country.population);

            // Create the bar graph
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Population',
                        data: populations,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

// Import Chart.js library
const ctx = document.getElementById('p2pChart').getContext('2d');

// Data from the CSV file
const data = {
    labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    datasets: [
        {
            label: 'Gen Z',
            data: [6.7, 9.9, 15.9, 20.5, 25.4, 30.6, 35.7],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        },
        {
            label: 'Millennial',
            data: [30.1, 35, 45.5, 49.6, 53, 55.6, 57.6],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        },
        {
            label: 'Gen X',
            data: [22.1, 25.7, 33.4, 36.4, 38.9, 41, 42.8],
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        },
        {
            label: 'Baby Boomers',
            data: [13.5, 15.3, 21.6, 23.9, 25.2, 25.8, 25.8],
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }
    ]
};

// Create the bar chart
new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'P2P Generational Forecast'
            }
        }
    }
});

