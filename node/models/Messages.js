const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessagesSchema = new Schema({
	userID: String,
	timestamp : {
		type: Date,
		default: Date.now
	},
	messages: [{
		role: String,
		content: String
	}]
})
module.exports = mongoose.model("Messages", MessagesSchema);