//IDEA: split up markdown items into divs (equations, bullets, etc.)
//and make each div have an onclick function to explain or justify the statement.
//Explaining creates and submits a new query, whereas justify searches for 
//textbooks or other informative material and uses rag to justify the statement.

const messages = [{
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

async function getVerification(event) {
	event.cancelBubble = true;
	let div = this;
	while(div.className != "bot-message") {
		div = div.parentElement;
	}
	const value = div.querySelector("span").innerText;
	const verificationMessages = [
		...messages,
		{
			role: "user",
			content: `Verify ${value}`
		}
	];
	const response = await chatRequest(verificationMessages);
	const {botMessage} = await response.json();
	alert(`VERIFICATION: ${botMessage}`);
}

function verifyDiv() {
	const verify = document.createElement("div");
	verify.className = "verify";
	verify.innerText = "verify";
	verify.onclick = getVerification;
	return verify;
}

async function getExplanation(event) {
	event.cancelBubble = true;
	let div = this;
	while(div.className != "bot-message") {
		div = div.parentElement;
	}
	const value = div.querySelector("span").innerText;
	const explanationMessages = [
		...messages,
		{
			role: "system",
			content: 
		}
		{
			role: "user",
			content: `I am having trouble understanding \"${value}\". Explain it more thoroughly.`
		}
	];
	const response = await chatRequest(explanationMessages);
	const {botMessage} = await response.json();
	alert(`EXPLANATION: ${botMessage}`);
}

function explainDiv() {
	const explain = document.createElement("div");
	explain.className = "explain";
	explain.innerText = "explain";
	explain.onclick = getExplanation;
	return explain;
}

function addMenu() {
	const menuContainer = document.createElement("div");
	menuContainer.className = "menu";
	menuContainer.appendChild(verifyDiv());
	menuContainer.appendChild(explainDiv());
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

function addMessageDiv(label, content) {
	const messageDiv = document.createElement("div");
	messageDiv.innerText = label;
	const span = document.createElement("span");
	span.innerText = content;
	messageDiv.appendChild(span);
	if(label.slice(0,3) == "Bot") {
		messageDiv.className = "bot-message";
		messageDiv.toggleMenu = toggleMenu;
		messageDiv.addMenu = addMenu;
		messageDiv.removeMenu = removeMenu;
		messageDiv.onclick = messageDiv.toggleMenu;
	} else if(label.slice(0,4) == "User") {
		messageDiv.className = "user-message";
	}
	messagesContainer.appendChild(messageDiv);
	messagesContainer.appendChild(document.createElement("br"));
}

async function chatRequest(messages) {
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
		addMessageDiv("User: ", userMessage);
		const response = await chatRequest(messages);
		const {botMessage} = await response.json();
		updateMessages("assistant", botMessage);
		addMessageDiv("Bot: ", botMessage);
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