const form = document.getElementById("chat-form");
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const inputField = document.getElementById("user-input");
const messagesContainer = document.getElementById("messages-container");

window.addEventListener("load", async () => {
	const response = await fetch("/baseline/chat/load", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			userID: localStorage.participantID
		})
	});
	const {history} = await response.json();
	console.log(history);
	history.forEach(message => {
		if(message.role != "system") {
			const prefix = message.role == "user" ? "User: " : "Agent: ";
			const messageDiv = addMessage(messagesContainer, prefix + texme.render(message.content));
		}
	});
	MathJax.typeset();
});

setTimeout(event => window.location.href = "/workflow.html", 1200000);

function getUserMessage() {
	const prompt = inputField.value;
	inputField.value = "";
	return prompt;
}

async function getChatResponse(prompt) {
	const response = await fetch("/baseline/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userID: localStorage.participantID,
			input: prompt,
			timestamp: new Date()
		})
	});
	const {botMessage} = await	response.json();
	return botMessage;
}

async function submitPrompt(event) {
	stopEvent(event);
	const prompt = getUserMessage();
	if(!prompt) {
		alert("Prompt is empty");
		return;
	}
	addMessage(messagesContainer, `User: ${prompt}`);
	const messageDiv = addMessage(messagesContainer, "Agent is thinking...");
	const response = await getChatResponse(prompt);
	messageDiv.innerHTML = texme.render(response);
	MathJax.typeset();
}

async function logEvent(event, element) {
	const response = await fetch("/baseline/log-event", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			userID: localStorage.participantID,
			eventType: event,
			elementName: element,
			timestamp: new Date()
		})
	});
}

function addMessage(location, content) {
	const messageDiv = document.createElement("div");
	messageDiv.classList.add("message");
	messageDiv.innerHTML = content;
	location.appendChild(messageDiv);
	location.appendChild(document.createElement("br"));
	messageDiv.addEventListener("mouseover", () => {
		logEvent("hover", "Chat Message");
	});
	inputField.addEventListener("focus", () => {
		logEvent("focus", "Chat Message");
	});
	return messageDiv;
}

//Stop event devault and propagation
function stopEvent(event) {
	event.preventDefault();
	event.stopPropagation();
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
	inputField.addEventListener("mouseover", () => {
		logEvent("hover", "User Input");
	});
	inputField.addEventListener("focus", () => {
		logEvent("focus", "User Input");
	});
}

if(sendBtn) {
	sendBtn.addEventListener("mouseover", () => {
		logEvent("hover", "sendBtn");
	})
	sendBtn.addEventListener("click", () => {
		logEvent("click", "Send Button");
	});
}