const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const EventLog = require("./models/EventLog");
const Interaction = require("./models/Interaction");
const Messages = require("./models/Messages");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

const histories = {};


mongoose.connect(process.env.MONGO_URI).then(() => {
	console.log("Successfully connected to MongoDB");
}).catch(error => {
	console.log(`Error connecting to MongoDB: ${error}`);
});

//Create server
const app = express();

function queryGPT(history) {
	return openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: history,
		max_tokens: 800
	});
}

async function getHistory(userID) {
	if(!histories[userID]) {
		let userHistory = await Messages.findOne({userID: userID});
		userHistory	= userHistory	? userHistory	: new Messages({
			userID: userID,
			messages: [{
				role: "system",
				content: "You are an expert. Format responses with markdown and latex when needed. Format all lists with markdown not latex."
			}]
		});
		histories[userID] = userHistory;
	}
}

//Use body parser and public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

//POST route for chat responses
app.post("/chat", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	await getHistory(userID);
	histories[userID].messages.push({
		role: "user",
		content: input
	});
	const response = await queryGPT(histories[userID].messages);
	const botMessage = response.choices[0].message.content.trim();
	histories	[userID].messages.push({
		role: "assistant",
		content: botMessage
	});
	histories[userID].save();
	res.json({
		botMessage, botMessage
	});
});

app.post("/sticky", async (req, res) => {
		const {userID, input, timestamp} = req.body;
		await getHistory(userID);
		const response = await queryGPT(histories[userID].messages.slice().push({
			role: "user",
			content: input
		}));
		const botMessage = response.choices[0].message.content.trim();
		res.json({
			botMessage: botMessage
		})
});

app.post("/log-event", async (req, res) => {
	const {eventType, elementName, timestamp} = req.body;
	const event = new EventLog({
		eventType: eventType,
		elementName: elementName,
		timestamp: timestamp
	})
	event.save().then(() => {
		res.sendStatus(200);
	}).catch(saveError => {
		console.log(`Error saving event log: ${saveError}`);
		res.sendStatus(500);
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

