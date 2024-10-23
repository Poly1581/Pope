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
    try{
    	const request = {
	    	model: "gpt-4o-mini",
	    	messages: [
	    		{
	    			role: "user",
	    			content: userMessage
	    		}
	    	],
	    	max_tokens: 500
	    }
	    const response = await openai.chat.completions.create(request);
	    const botMessage = response.choices[0].message.content.trim();
	    console.log(botMessage);
	    const interaction = new Interaction({
	    	userInput: userMessage,
	    	botResponse: botMessage,
	    	timestamp: timestamp
	    });
	    await interaction.save();
	    res.json({
	    	botMessage: botMessage
	    });
    } catch (error) {
    	console.log(`Error serving chat response: ${error}`);
    	res.sendStatus(500);
    }
});

app.post("/log-event", async (req, res) => {
	const {eventType, elementName, timestamp} = req.body;
	try {
		const event = new EventLog({
			eventType: eventType,
			elementName: elementName,
			timestamp: timestamp
		});
		await event.save();
		res.sendStatus(200);
	} catch (error) {
		console.log(`Error saving event log: ${error}`);
		res.sendStatus(500);
	}
});

app.post("/get-db", async (req, res) => {
	try {
		const documents = await Interaction.find();
		res.json({
			documents: documents
		});
	} catch (err) {
		console.log(`Error getting documents: ${error}`);
		res.sendStatus(500);
	}
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

