const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    console.log(`User message: ${userMessage}`);
    res.json({ userMessage: userMessage, response: "Message Received!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

