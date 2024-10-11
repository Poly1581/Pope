let messagesContainer = document.getElementById("messages");
let inputField = document.getElementById("user-input");
let form = document.getElementById("chat-form");

//IDEA: split up latex items into divs (equations, bullets, etc.)
//and make each div have an onclick function to explain or justify the statement.
//Explaining creates and submits a new query, whereas justify searches for 
//textbooks or other informative material and uses rag to justify the statement.

let messages = [{
	role: "system",
	content: "You are a helpful asistant."
}];

function newMessage(role, content) {
	return  {
		role: role,
		content: content
	}
}

function updateMessages(role, content) {
	messages.push(newMessage(role, content));
}

function getUserMessage() {
	const content = inputField.value;
	inputField.value = "";
	return content;
}

function addMenu() {
	const menuContainer = document.createElement("div");
	menuContainer.className = "menu";
	const verify = document.createElement("div");
	verify.className = "verify";
	verify.innerText = "verify";
	menuContainer.appendChild(verify);
	const explain = document.createElement("div");
	explain.className = "explain";
	explain.innerText = "explain";
	menuContainer.appendChild(explain);
	this.showingMenu = true;
	this.appendChild(menuContainer);
}

function removeMenu() {
	const menu = this.querySelector(".menu");
	this.showingMenu = false;
	this.removeChild(menu);
}

function toggleMenu() {
	if(!this.showingMenu) {
		this.addMenu();
	} else {
		this.removeMenu();
	}
}

function addMessageDiv(content) {
	const messageDiv = document.createElement("div");
	messageDiv.innerText = content;
	if(content.slice(0,3) == "Bot") {
		messageDiv.toggleMenu = toggleMenu;
		messageDiv.addMenu = addMenu;
		messageDiv.removeMenu = removeMenu;
		messageDiv.onclick = messageDiv.toggleMenu;
	}
	messagesContainer.appendChild(messageDiv);
	const lineBreak = document.createElement("br");
	messagesContainer.appendChild(lineBreak);
	return messageDiv;
}

async function chatRequest() {
	return fetch("/chat", {
		method: "POST",
		headers:{
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messages: messages,
			timestamp: new Date()
		})
	});
}

async function submitPrompt(event) {
	event.preventDefault();
	try {
		const userMessage = getUserMessage();
		updateMessages("user", userMessage);
		addMessageDiv(`User: ${userMessage}`);
		const response = await chatRequest(messages);
		const {botMessage} = await response.json();
		updateMessages("assistant", botMessage);
		addMessageDiv(`Bot: ${botMessage}`);
	} catch (error) {
		console.log(`Error submitting message: ${error}`);
	}
}

if(form) {
	form.addEventListener("submit", submitPrompt);
}

if(inputField) {
	inputField.addEventListener("keypress", (event) => {
		if(event.key === "Enter") {
			submitPrompt(event);
		}
	});
}