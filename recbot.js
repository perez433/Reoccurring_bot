const express = require('express');
const axios = require('axios');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000; // Set port from environment variable or default to 3000

let chatId = '-1002050375559';
let botToken = '6922022031:AAG68hbf-kElixJRIBHUD60-VykLAp7mlAg';
let interval = 20000;

let sendOut; // To hold the interval ID

app.use(bodyParser.urlencoded({ extended: true })); // To parse form data

// Read message from message.txt
function readMessage() {
  return fs.readFileSync('message.txt', 'utf8');
}

// Function to send message to chat ID
async function sendMessage(chatId, message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML' // Parse message as HTML
    });

    if (!response.data.ok) {
      console.error('Error sending message:', response.data);
      return false;
    } else {
      console.log('Message sent successfully:', response.data);
      return true;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

function sendRecurringMessage() {
  const messageContent = readMessage();
  const message = `${messageContent}`;
  sendMessage(chatId, message);
}

// Endpoint to start the sendout
app.get('/start', (req, res) => {
  if (!sendOut) {
    sendOut = setInterval(function() {
      console.log('Sending recurring message in setInterval...');
      sendRecurringMessage();
    }, interval);
    res.send('Bot started and is sending messages...');
  } else {
    res.send('Bot is already running...');
  }
});

// Endpoint to stop the sendout
app.get('/stop', (req, res) => {
  if (sendOut) {
    clearInterval(sendOut);
    sendOut = null; // Reset sendOut to indicate it has been cleared
    res.send('Bot has stopped');
  } else {
    res.send('Bot is not running...');
  }
});

// Serve form for updating bot details
app.get('/update', (req, res) => {
  res.send(`
    <form action="/update" method="post">
      <label for="chatId">Chat ID:</label>
      <input type="text" id="chatId" name="chatId" value="${chatId}"><br><br>
      <label for="botToken">Bot Token:</label>
      <input type="text" id="botToken" name="botToken" value="${botToken}"><br><br>
      <label for="interval">Interval (ms):</label>
      <input type="number" id="interval" name="interval" value="${interval}"><br><br>
      <input type="submit" value="Update">
    </form>
  `);
});

// Handle form submission to update bot details
app.post('/update', (req, res) => {
  chatId = req.body.chatId;
  botToken = req.body.botToken;
  interval = parseInt(req.body.interval);

  // Restart the interval if it is running
  if (sendOut) {
    clearInterval(sendOut);
    sendOut = setInterval(function() {
      console.log('Sending recurring message in setInterval...');
      sendRecurringMessage();
    }, interval);
  }

  res.send('Bot details updated successfully.');
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Bot is listening on port ${PORT}`);
});