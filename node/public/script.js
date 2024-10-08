const messagesContainer = document.getElementById("messages");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const form = document.getElementById("chat-form");

async function submitPrompt(event) {
	event.preventDefault();
	const prompt = inputField.value;
	if(!prompt) {
		alert("Prompt is empty");
		return;
	}
	messagesContainer.innerHTML += `User: ${prompt}<br>`;
	inputField.value = "";
	const response = await fetch("/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userMessage: prompt,
			timestamp: new Date()
		})
	});
	const {botMessage} = await response.json();
	console.log(botMessage);
	messagesContainer.innerHTML += `Bot: ${botMessage}<br>`;
}

async function logEvent(event, element) {
	const response = await fetch("/log-event", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			eventType: event,
			elementName: element,
			timestamp: new Date()
		})
	});
	console.log(response);
}

async function getDB() {
	const response await fetch("/get-db" {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			timestamp
		})
	});
	console.log(response.documents);
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

