const userInput = document.getElementById("user-input");
const chatContainer = document.getElementById("chat-container");
const stickyContainer = document.getElementById("sticky-container");
const messagesContainer = document.getElementById("messages");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const form = document.getElementById("chat-form");

window.marked.use({
	breaks: true
});

let previousHighlightedMessage = null;

function getUserMessage() {
	const prompt = inputField.value;
	inputField.value = "";
	return prompt;
}

function addMessage(content) {
	const messageDiv = document.createElement("div");
	messageDiv.classList.add("message");
	messageDiv.innerHTML = content;
	messagesContainer.appendChild(messageDiv);
	messagesContainer.appendChild(document.createElement("br"));
	return messageDiv;
}

async function submitPrompt(event) {
	event.preventDefault();
	event.stopPropagation();
	const prompt = getUserMessage();
	if(!prompt) {
		alert("Prompt is empty");
		return;
	}
	addMessage(`User: ${prompt}`);
	const response = await fetch("/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userMessage: prompt,
			timestamp: new Date()
		})
	});
	const {botMessage} = await response.json();
	const botMessageDiv = addMessage(texme.render(`Assistant: ${botMessage}`));
	MathJax.typeset();
	//TRAVERSE BOTMESSAGEDIV CHILDREN AND ADD ONCLICK TO SHOW MENU
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
}

async function getDB() {
	const response = await fetch("/get-db", {
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

function makeDiv(content, className) {
	const temp = document.createElement("div");
	temp.innerText = content;
	temp.className = className;
	return temp;
}

//ADD ONCLICK
function makeClickableDiv(content, className, onclick) {
	temp = makeDiv(content, className);
	temp.onclick = onclick;
	return temp;
}

function makeHeader(contextDiv, body) {
	const header = makeDiv("", "stickyHeader");

	//ADD ONCLICK TO TRAVERSE UP TREE AND DELETE SELF
	const close = makeClickableDiv("x", "close", event => {
		event.stopPropagation();
		let element = event.target;
		while(!element.classList.contains("sticky")) {
			console.log(`CURRENT: ${element}`);
			element = element.parentElement;
		}
		console.log(`FINAL: ${element}`);
		element.remove();
	});

	//ADD ONCLICK TO TOGGLE HIGHLIGHT OF CONTEXT DIV
	const context = makeClickableDiv("show context", "context", event => {
		event.stopPropagation();
		if(previousHighlightedMessage) {
			previousHighlightedMessage.classList.toggle("highlight");
		}
		contextDiv.classList.toggle("highlight");
		previousHighlightedMessage = contextDiv;
	});

	//ADD ONCLICK TO MINIMIZE EXPLANATION
	const minimize = makeClickableDiv("-", "minimize", event => {
		event.stopPropagation();
		header.classList.toggle("minimized");
		body.classList.toggle("minimized");
	});

	header.appendChild(close);
	header.appendChild(context);
	header.appendChild(minimize);

	return header;
}

function makeSticky(context, content) {
	//SET WIDTH AND HEIGHT
	const body = makeDiv(content, "stickyBody");
	const header = makeHeader(context, body);
	const sticky = makeDiv("", "sticky");
	sticky.appendChild(header);
	sticky.appendChild(body);
	sticky.classList.add("draggable");
	stickyContainer.appendChild(sticky);
}


const test = addMessage("Test: this is a test");
makeSticky(test, "this is a test");	
const anotherTest = addMessage("Test: this is another test");
makeSticky(anotherTest, "this is a test");	

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

function dragMoveListener (event) {
	var target = event.target
	// keep the dragged position in the data-x/data-y attributes
	var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
	var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

	// translate the element
	target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

	// update the posiion attributes
	target.setAttribute('data-x', x)
	target.setAttribute('data-y', y)
}

interact('.draggable').draggable({
	modifiers: [
		interact.modifiers.restrictRect({
			restriction: 'parent',
			endOnly: false
		})
	],
	listeners: {
		move: dragMoveListener
	}
})