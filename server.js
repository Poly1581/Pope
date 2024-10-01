const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const fs = require("fs");

//Create server
const app = express();

//Use body parser and public directory
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

//Try to serve file requests
const matchPath = /(\/[a-z0-9]+)+\.[a-z0-0]+/i;
app.get(matchPath, (req, res) => {
	let filePath = path.join(__dirname, "public", ...req.path.split("/"));
	//Check if file exists
	if(fs.existsSync(filePath)) {
		//Try to access file
		try {
			fs.accessSync(filePath, fs.R_OK);
			res.sendFile(filePath);
		} catch (error) {
			//Cannot access file
			console.log(`Error ${error} when accesssing file ${filePath}`);
			res.sendStatus(403);
		}
	} else {
		//File does not exist
		console.log(`${filePath} requested but not found`);
		res.sendStatus(404);
	}
});

//POST route for chat responses
app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    console.log(`User message: ${userMessage}`);
    res.json({ userMessage: userMessage, response: "Message Received!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

