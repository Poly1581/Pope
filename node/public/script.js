const form = document.getElementById("chat-form");
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const inputField = document.getElementById("user-input");
const messagesContainer = document.getElementById("messages");
const chatContainer = document.getElementById("chat-container");
const stickyContainer = document.getElementById("sticky-container");

window.marked.use({
	breaks: true
});

let previousHighlightedMessage = null;

function getUserMessage() {
	const prompt = inputField.value;
	inputField.value = "";
	return prompt;
}

function cleanResponse(botResponse) {
	const equals = /&\s*=/gs
	const lineBreak = / \\\\/gs;;
	const startAlign = /\\\[\s\\begin{align\*}\s/gs;
	const endAlign = /\\end{align\*}\s\\\]/gs;
	const align = /\\\[(\s)*\\begin{align\*}.*\\end{align\*}\s\\\]/gs;
	const replaced = botResponse.replaceAll(align, match => {
		const replaceLine = match.replaceAll(lineBreak, lineMatch => "\\\)\n - \\\(");
		const replaceStart = replaceLine.replaceAll(startAlign, startMatch => "- \\\(");
		const replaceEnd = replaceStart.replaceAll(endAlign, endMatch => "\\\)");
		const replaceEquals = replaceEnd.replaceAll(equals, "=");
		return replaceEquals;
	});
	return replaced;
}

async function getResponse(prompt) {
	const request = {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userMessage: prompt,
			timestamp: new Date()
		})
	}
	const response = await fetch("/chat", request);
	const {botMessage} = await response.json();
	console.log(botMessage);
	return cleanResponse(botMessage);
}

async function submitPrompt(event) {
	stopEvent(event);
	const prompt = getUserMessage();
	if(!prompt) {
		alert("Prompt is empty");
		return;
	}
	addMessage(`User: ${prompt}`);
	const messageDiv = addMessage(texme.render(`Assistant: ${await getResponse(prompt)}`));
	MathJax.options.enableMenu = false;
	MathJax.typeset();
	makeInteractive(messageDiv);
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

function makeClickable(div) {
	div.addMenu = addMenu;
	div.removeMenu = removeMenu;
	div.toggleMenu = toggleMenu;
	div.onclick = div.toggleMenu;
}

function addMessage(content) {
	const messageDiv = document.createElement("div");
	messageDiv.classList.add("message");
	messageDiv.innerHTML = content;
	messagesContainer.appendChild(messageDiv);
	messagesContainer.appendChild(document.createElement("br"));
	return messageDiv;
}

function toggleMenu() {
	if(this.showingMenu) {
		this.removeMenu();
	} else {
		this.addMenu();
	}
}

function removeMenu() {
	this.querySelector(".menu").remove();
	this.showingMenu = !this.showingMenu;
}

const interactions = [
	{
		name: "explain",
		action: (content, prompt) => `I am having trouble understanding \"${content}\". Explain it in the context of responding to the prompt \"${prompt}\". Do not try to answer the prompt, just explain \"${content}\" Respond concisely.`
	},
];

function addMenu() {
	const menuContainer = document.createElement("div");
	menuContainer.classList.add("menu");
	interactions.map(({name, action}) => makeClickableDiv(name, "interaction", async event=> {
		stopEvent(event);
		this.removeMenu();
		const assistantTag = "Assistant: ";
		const tagLength = assistantTag.length;
		let content = this.textContent;
		content = content.slice(0, tagLength) == assistantTag ? content.slice(tagLength) : content;
		let message = this;
		while(!message.classList.contains("message")) {
			message = message.parentElement;
		}
		const prompt = message.textContent;
		console.log(`Content: ${content}`);
		console.log(`Prompt: ${prompt}`);
		console.log(`Action: ${action(content, prompt)}`);
		const response = await getResponse(action(content, prompt));
		console.log(`RESPONSE: ${response}`);
		makeSticky(this, texme.render(response));
		MathJax.typeset();
	})).forEach(interactionDiv => menuContainer.appendChild(interactionDiv));
	this.appendChild(menuContainer);
	this.showingMenu = !this.showingMenu;
}

function makeInteractive(messageDiv) {
	//Make all paragraphs clickable
	const paragraphs = messageDiv.querySelectorAll("p:not(:has(mjx-mtr))");
	// console.log("paragraphs:");
	paragraphs.forEach(p => {
		makeClickable(p);
		// console.log(p);
	});
	//Make all bullets clickable
	const bullets = messageDiv.querySelectorAll("li");
	// console.log("bullets:");
	bullets.forEach(li => {
		makeClickable(li);
		// console.log(li);
	});
	//Make latex clickable
	const lines = messageDiv.querySelectorAll("mjx-mtr");
	// console.log("lines");
	lines.forEach(mjxmtr => {
		makeClickable(mjxmtr);
		// console.log(mjxmtr);
	});
}

//Make a clickable div (make div and set onclick)
function makeClickableDiv(content, className, onclick) {
	temp = makeDiv(content, className);
	temp.onclick = onclick;
	return temp;
}

//Make a div with content and class
function makeDiv(content, className) {
	//Make div
	const div = document.createElement("div");
	//Set content
	div.innerHTML = content;
	//Set class
	div.className = className;
	return div;
}


//Stop event devault and propagation
function stopEvent(event) {
	event.preventDefault();
	event.stopPropagation();
}

//Make sticky
function makeSticky(context, content) {
	//SET WIDTH AND HEIGHT
	const sticky = makeDiv("", "sticky");
	const body = makeDiv(content, "stickyBody");
	const header = makeHeader(context, body);
	sticky.appendChild(header);
	sticky.appendChild(body);
	stickyContainer.appendChild(sticky);
}

//Make sticky header
function makeHeader(contextDiv, body) {
	const header = makeDiv("", "stickyHeader");
	header.appendChild(makeClose(contextDiv));
	header.appendChild(makeContext(contextDiv));
	header.appendChild(makeMinimize(body));
	return header;
}

//Make close button
function makeClose(contextDiv) {
	return makeClickableDiv("x", "close", event => {
		stopEvent(event);
		//Get sticky (ancestor of close button)
		let sticky = event.target;
		while(!sticky.classList.contains("sticky")) {
			sticky = sticky.parentElement;
		}
		//Remove previousHighlightedMessage highlight if needed
		if(contextDiv && previousHighlightedMessage) {
			if(previousHighlightedMessage == contextDiv && previousHighlightedMessage.classList.contains("highlight")) {
				previousHighlightedMessage.classList.toggle("highlight");
				previousHighlightedMessage = null;
			}
		}
		//Delete sticky
		sticky.remove();
	})
}

//Make show context button
function makeContext(contextDiv) {
	return makeClickableDiv("show context", "context", event => {
		stopEvent(event);
		//Remove previousHighlightedMessage highlight if needed
		if(contextDiv && previousHighlightedMessage) {
			if(previousHighlightedMessage != contextDiv && previousHighlightedMessage.classList.contains("highlight")) {
				previousHighlightedMessage.classList.toggle("highlight");
			}
		}
		previousHighlightedMessage = contextDiv;
		previousHighlightedMessage.classList.toggle("highlight");
	});
}

//Make minimize button
function makeMinimize(body) {
	return makeClickableDiv("-", "minimize", event => {
		stopEvent(event);
		body.classList.toggle("minimized");
	})
}

//Apply drag action to draggables
position = {
	x: 0,
	y: 0
}

interact(".sticky").draggable({
	modifiers: [
		interact.modifiers.restrictRect({
			restriction: "parent",
			endOnly: false
		})
	],
	listeners: {
		move (event) {
			position.x += event.dx
			position.y += event.dy
			event.target.style.transform = `translate(${position.x}px, ${position.y}px)`
		},
	}
});

interact(".sticky").resizable({
	edges: {
		top: true,
		bottom: true,
		left: true,
		right: true
	}
})

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