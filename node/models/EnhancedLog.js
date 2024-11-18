const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnhancedLogSchema = new Schema({
	userID: String,
	timestamp : {
		type: Date,
		default: Date.now
	},
	interactions: [{
		eventType: String,
		elementName: String,
		timestamp: {
			type: Date,
			default: Date.now
		}	
	}],
	history: [{
		role: String,
		content: String
	}],
	stickies: [{
		prompt: String,
		response: String
	}]
})

module.exports = mongoose.model("EnhancedLog", EnhancedLogSchema);