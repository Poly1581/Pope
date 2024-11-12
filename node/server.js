const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const History = require("./models/History");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

mongoose.connect(process.env.MONGO_URI).then(() => {
	console.log("Successfully connected to MongoDB");
}).catch(error => {
	console.log(`Error connecting to MongoDB: ${error}`);
});

const histories = {};

setInterval(() => {
	console.log("Saving user histories");
	for(const userID in histories) {
		console.log(`\tSaving ${userID}'s history`);
		histories[userID].save();
	}
}, 10000);

const app = express();

async function askChatGPT(userID, prompt = null) {
	if(!hasHistory(userID)) {
		await getHistory(userID);
	}
	const userHistory = histories[userID].history.slice();
	if(prompt) {
		userHistory.push({
			role: "user",
			content: prompt
		})
	}
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: userHistory,
		max_tokens: 800
	});
	return response.choices[0].message.content.trim();
}

async function addHistory(userID, role, content) {
	if(!hasHistory(userID)) {
		await getHistory(userID);
	}
	histories[userID].history.push({
		role: role,
		content: content
	});
}

async function addMessage(userID, message) {
	if(!hasHistory(userID)) {
		await getHistory(userID);
	}
	histories[userID].history.push(message);
}

function hasHistory(userID) {
	return userID in histories;
}

async function getHistory(userID) {
	//Try to get history from database
	const userHistory = await History.findOne({userID: userID});
	if(userHistory) {
		//If history found, store locally
		histories[userID] = userHistory;
	} else {
		//If no history found, make a new one with a default system message
		histories[userID] = new History({
			userID: userID,
			interactions: [],
			history: [{
				role: "system",
				content: "You are an expert. Format responses with markdown and latex when needed. Format all lists with markdown not latex."
			}],
			stickies: []
		});
	}
}

//Use body parser and public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.post("/chat/create", async (req, res) => {
	const {userID, prompt, userMessage} = req.body;
	addHistory(userID, "user", prompt);
	addMessage(userID, userMessage);
	const response = await askChatGPT(userID);
	addHistory(userID, "assistant", response);
	addMessage(userID, response);
	res.json({
		response: response
	});
});

//POST route for chat responses
app.post("/chat", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	await getHistory(userID);
	histories[userID].history.push({
		role: "user",
		content: input
	});
	const response = await askChatGPT(userID);
	histories	[userID].history.push({
		role: "assistant",
		content: response
	});
	res.json({
		botMessage: response
	});
});

app.post("/chat/load", async (req, res) => {
	const {userID} = req.body;
	const userHistory = await getHistory(userID);
	res.json({
		history: histories[userID]
	})
});

app.post("/sticky", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	if(!hasHistory(userID)) {
		await getHistory(userID);
	}
	const response = await askChatGPT(userID, input);
	res.json({
		botMessage: response
	});
});

app.post("/log-event", async (req, res) => {
	const {userID, eventType, elementName} = req.body;
	if(!hasHistory(userID)) {
		await getHistory(userID);
	}
	histories[userID].interactions.push({
		eventType: eventType,
		elementName: elementName
	});
	res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

