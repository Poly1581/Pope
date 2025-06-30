const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

//===============================================================OPENAI CODE=================================================================
//Initialize OpenAI API
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

//Query ChatGPT with chat history
async function askChatGPT(history, prompt = null) {
	//Make a (shallow) copy of chat history (to avoid pushing sticky prompts to chat history)
	const tempHistory = [...history];
	if(prompt) {
		//Include prompt for sticky requests
		tempHistory.push({
			role: "user",
			content: prompt
		});
	}
	//Query ChatGPT
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: tempHistory,
		max_tokens: 800
	});
	//Return response
	return response.choices[0].message.content.trim();
}

//==============================================================DATABASE CODE================================================================
//Try to connect to the database
mongoose.connect(process.env.MONGO_URI).then(() => {
	console.log("Successfully connected to MongoDB");
}).catch(error => {
	console.log(`Error connecting to MongoDB: ${error}`);
});

//Require log models and store locally
const BaselineLog = require("./models/BaselineLog");
const baselineLogs = {};
const EnhancedLog = require("./models/EnhancedLog");
const enhancedLogs = {};

//Update database every 30 seconds (offset to avoid issues)
setInterval(() => {
	console.log("Saving enhanced user logs");
	for(const userID in enhancedLogs) {
		console.log(`\tSaving ${userID}'s enhanced logs`);
		enhancedLogs[userID].save();
	}
}, 30000);

setTimeout(() => {
	setInterval(() => {
		console.log("Saving default user logs");
		for(const userID in baselineLogs) {
			console.log(`\tSaving ${userID}'s enhanced logs`);
			baselineLogs[userID].save();
		}
	}, 30000);
}, 15000);

//================================================================EXPRESS CODE===============================================================
//Start express app
const app = express();

//Use body parser and public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

//Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Pope.html"));
});

//Listen on env port (default to 3000)
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//=======================================================ENHANCED FUNCTIONS AND ROUTES=======================================================

async function getEnhancedLogs(userID) {
	//Try to get log from database
	const enhancedUserLogs = await EnhancedLog.findOne({userID: userID});
	//Create inital log if not in database yet
	enhancedLogs[userID] = enhancedUserLogs ? enhancedUserLogs : new EnhancedLog({
		userID: userID,
		interactions: [],
		history: [{
			role: "system",
			content: "You are an expert. Format responses with markdown and latex when needed. Format all lists with markdown not latex."
		}]
	});
}

async function addEnhancedMessage(userID, message) {
	if(!(userID in enhancedLogs)) {
		await getEnhancedLogs(userID);
	}
	enhancedLogs[userID].history.push(message);
}

async function addEnhancedInteraction(userID, interaction) {
	if(!(userID in enhancedLogs)) {
		await getEnhancedLogs(userID);
	}
	enhancedLogs[userID].interactions.push(interaction);
}

async function addSticky(userID, sticky) {
	if(!(userID in enhancedLogs)) {
		await getEnhancedLogs(userID);
	}
	enhancedLogs[userID].stickies.push(sticky);
}

app.post("/enhanced/chat", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	addEnhancedMessage(userID, {
		role: "user",
		content: input
	});
	const response = await askChatGPT(enhancedLogs[userID].history);
	addEnhancedMessage(userID, {
		role: "assistant",
		content: response
	});
	res.json({
		botMessage: response
	});
});

app.post("/enhanced/chat/load", async (req, res) => {
	const {userID} = req.body;
	await getEnhancedLogs(userID);
	res.json({
		history: enhancedLogs[userID].history
	})
});

app.post("/enhanced/log-event", async (req, res) => {
	const {userID, eventType, elementName} = req.body;
	addEnhancedInteraction(userID, {
		eventType: eventType,
		elementName: elementName
	});
	res.sendStatus(200);
});

app.post("/enhanced/sticky", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	const response = await askChatGPT(enhancedLogs[userID].history, input);
	addSticky(userID, {
		prompt: input,
		response: response
	})
	res.json({
		botMessage: response
	});
});



//=======================================================BASELINE FUNCTIONS AND ROUTES=======================================================
async function getBaselineLogs(userID) {
	const baselineUserHistory = await BaselineLog.findOne({userID: userID});
	baselineLogs[userID] = baselineUserHistory ? baselineUserHistory : new BaselineLog({
		userID: userID,
		interactions: [],
		history: [{
			role: "system",
			content: "You are an expert. Format responses with markdown and latex when needed. Format all lists with markdown not latex."
		}]
	});
}

async function addBaselineMessage(userID, message) {
	if(!(userID in baselineLogs)) {
		await getBaselineLogs(userID);
	}
	baselineLogs[userID].history.push(message);
}

async function addBaselineInteraction(userID, interaction) {
	if(!(userID in baselineLogs)) {
		await getBaselineLogs(userID);
	}
	baselineLogs[userID].interactions.push(interaction);
}

app.post("/baseline/chat", async (req, res) => {
	const {userID, input, timestamp} = req.body;
	addBaselineMessage(userID, {
		role: "user",
		content: input
	});
	const response = await askChatGPT(baselineLogs[userID].history);
	addBaselineMessage(userID, {
		role: "assistant",
		content: response
	});
	res.json({
		botMessage: response
	});
});

app.post("/baseline/chat/load", async (req, res) => {
	const {userID} = req.body;
	await getBaselineLogs(userID);
	res.json({
		history: baselineLogs[userID].history
	})
});

app.post("/baseline/log-event", async (req, res) => {
	const {userID, eventType, elementName} = req.body;
	addBaselineInteraction(userID, {
		eventType: eventType,
		elementName: elementName
	})
	res.sendStatus(200);
});
