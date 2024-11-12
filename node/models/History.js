const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
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
	}]
})

module.exports = mongoose.model("History", HistorySchema);