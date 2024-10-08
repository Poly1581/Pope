const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventLogSchema = new Schema({
	eventType: String,			// Store event type
	elementName: String,		// Store element associated with event
	timestamp: {
		type: Date,				// Store time of interaction
		default: Date.now		// Default to now
	}
})

module.exports = mongoose.model("EventLog", EventLogSchema);