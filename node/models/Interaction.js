const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InteractionSchema = new Schema({
	userInput: String,			// Store user message
	botResponse: String,		// Store bot response
	timestamp: {
		type: Date,				// Store time of interaction
		default: Date.now		// Default to now
	}
});

module.exports = mongoose.model("Interaction", InteractionSchema);