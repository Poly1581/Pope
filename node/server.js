const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const EventLog = require("./models/EventLog");
const Interaction = require("./models/Interaction");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

mongoose.connect(process.env.MONGO_URI).then(() => {
	console.log("Successfully connected to MongoDB");
}).catch(error => {
	console.log(`Error connecting to MongoDB: ${error}`);
});

//Create server
const app = express();

//Use body parser and public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

//POST route for chat responses
app.post('/chat', async (req, res) => {
	const {userMessage, timestamp} = req.body;
	openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: "You are an expert. Format responses with markdown and latex when needed. Format all lists with markdown not latex."
			},
			{
				role: "user",
				content: userMessage
			}
		],
		max_tokens: 800
	}).then(response => {
		const botMessage = response.choices[0].message.content.trim();
		res.json({
			botMessage: botMessage
		});
		const interaction = new Interaction({
			userInput: userMessage,
			botResponse: botMessage,
			timestamp: timestamp
		});
		interaction.save().catch(saveError => {
			console.log(`Error saving interction: ${saveError}`);
		})
	}).catch(requestError => {
		console.log(`Error in openai request: ${requestError}`);
		res.sendStatus(500);
	});
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

app.post("/get-db", async (req, res) => {
	interaction.find().then(documents => {
		res.json({
			documents: documents
		});
	}).catch(databaseError => {
		console.log(`Error getting documents: ${databaseError}`);
		res.sendStatus(500);
	});
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

