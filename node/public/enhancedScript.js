const form = document.getElementById("chat-form");
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const inputField = document.getElementById("user-input");
const messagesContainer = document.getElementById("messages-container");
const stickyContainer = document.getElementById("sticky-container");

window.marked.use({
	breaks: true
});

let previousHighlightedMessage = null;

window.addEventListener("load", async () => {
	const response = await fetch("/enhanced/chat/load", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			userID: localStorage.participantID
		})
	});
	const {history} = await response.json();
	//Add demo
	addDemo();
	history.forEach(message => {
		if(message.role != "system") {
			const prefix = message.role == "user" ? "User: " : "Agent: ";
			const messageDiv = addMessage(messagesContainer, texme.render(prefix + cleanResponse(message.content)));
			const stickyDiv = addMessage(stickyContainer, texme.render(prefix + cleanResponse(message.content)));
			if(message.role == "assistant") {
				makeInteractive(messageDiv);
			}
		}
	});
	MathJax.options.enableMenu = false;
	MathJax.typeset();
});

setTimeout(event => window.location.href = "/workflow.html", 1200000);

function getUserMessage() {
	const prompt = inputField.value;
	inputField.value = "";
	return prompt;
}

function cleanResponse(botResponse) {
	const equals = /&\s*=/gs;
	const lineBreak = / \\\\/gs;
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

async function getChatResponse(prompt) {
	const response = await fetch("/enhanced/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userID: localStorage.participantID,
			input: prompt,
			timestamp: new Date()
		})
	});
	const {botMessage} = await	response.json();
	return cleanResponse(botMessage);
}

async function getStickyResponse(prompt) {
	const response = await fetch("/enhanced/sticky", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			userID: localStorage.participantID,
			input: prompt,
			timestamp: new Date()
		})
	});
	const {botMessage} = await	response.json();
	return cleanResponse(botMessage);
}

async function submitPrompt(event) {
	stopEvent(event);
	const prompt = getUserMessage();
	if(!prompt) {
		alert("Prompt is empty");
		return;
	}
	addMessage(messagesContainer, `User: ${prompt}`);
	addMessage(stickyContainer, `User: ${prompt}`);
	const messageDiv = addMessage(messagesContainer, "Agent is thinking...");
	const stickyPaddingDiv = addMessage(stickyContainer, "");
	const rendered = `Agent: ${texme.render(await getChatResponse(prompt))}`;
	messageDiv.innerHTML = rendered;
	stickyPaddingDiv.innerHTML = rendered;
	MathJax.options.enableMenu = false;
	MathJax.typeset();
	makeInteractive(messageDiv);
}

async function logEvent(event, element) {
	const response = await fetch("/enhanced/log-event", {
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

function addDemo() {
	const demo = addMessage(messagesContainer, "Demo");
	makeClickable(demo);
	demo.addMenu = function() {
		const menuContainer = document.createElement("div");
		menuContainer.classList.add("menu");
		menuContainer.appendChild(makeClickableDiv("explain interactions", "interaction", event => {
			stopEvent(event);
			this.removeMenu();
			const content = texme.render("- Click on any part of an assistant response that you wish to have explained to add an interaction menu.\n" +
				"- Click explain to explain the part of the response you clicked on.\n" +
				"- The explanation will be rendered in a note that can be minimized, closed, or moved.\n" + 
				"- Click \"show context\" on the top of the note to highlight the part of the response that the sticky note explains.");
			const rect = stickyContainer.getBoundingClientRect();
			const vertical = event.clientY + stickyContainer.scrollTop - rect.top;
			const horizontal = (rect.right - rect.left) / 2 - 150;
			makeSticky(this, content, vertical, horizontal);
		}));
		this.appendChild(menuContainer);
		this.showingMenu = !this.showingMenu;
	}
	demo.toggleMenu();
}

function makeClickable(div) {
	div.addMenu = addMenu;
	div.removeMenu = removeMenu;
	div.toggleMenu = toggleMenu;
	div.onclick = div.toggleMenu;
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
		const rect = stickyContainer.getBoundingClientRect();
		const vertical = event.clientY + stickyContainer.scrollTop - rect.top - 150;
		const horizontal = (rect.right - rect.left) / 2 - 150;
		const sticky = makeSticky(this, "Assistant is explaining...", vertical, horizontal);
		sticky.querySelector(".stickyBody").innerHTML = texme.render(await getStickyResponse(action(content, prompt)));
		MathJax.typeset();
	})).forEach(interactionDiv => menuContainer.appendChild(interactionDiv));
	// menuContainer.appendChild(makeClickableDiv("+", "addInteraction", event => {
		
	// }));
	this.appendChild(menuContainer);
	this.showingMenu = !this.showingMenu;
}

function makeInteractive(messageDiv) {
	//Make all paragraphs clickable
	const paragraphs = messageDiv.querySelectorAll("p:not(:has(li), :has(p))");
	// console.log("paragraphs:");
	paragraphs.forEach(p => {
		makeClickable(p);
		// console.log(p);
	});
	//Make all bullets clickable
	const bullets = messageDiv.querySelectorAll("li:not(:has(li), :has(p))");
	// console.log("bullets:");
	bullets.forEach(li => {
		makeClickable(li);
		// console.log(li);
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
function makeSticky(context, content, vertical, horizontal) {
	//SET WIDTH AND HEIGHT
	const sticky = makeDiv("", "sticky");
	const body = makeDiv(content, "stickyBody");
	const header = makeHeader(context, body);
	sticky.appendChild(header);
	sticky.appendChild(body);
	sticky.setAttribute("ypos", vertical);
	sticky.setAttribute("xpos", horizontal)
	sticky.style.transform = `translate(${horizontal}px, ${vertical}px)`;
	stickyContainer.appendChild(sticky);
	stickyContainer.addEventListener("mouseover", () => {
		logEvent("hover", "Sticky");
	});
	stickyContainer.addEventListener("focus", () => {
		logEvent("focus", "Sticky");
	});
	return sticky;
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
interact(".sticky").styleCursor(false)
interact(".sticky").draggable({
	autoScroll: true,
	modifiers: [
		interact.modifiers.restrictRect({
			restriction: "parent",
			endOnly: false
		})
	],
	listeners: {
		move (event) {
			const target = event.target;
			let ypos = parseInt(target.getAttribute("ypos") || 0);
			let xpos = parseInt(target.getAttribute("xpos") || 0);
			xpos += event.dx;
			ypos += event.dy;
			event.target.style.transform = `translate(${xpos}px, ${ypos}px)`;
			target.setAttribute("ypos", ypos);
			target.setAttribute("xpos", xpos);
		},
	}
});

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

function syncScroll(source, target) {
	target.scrollTop = source.scrollTop;
}

messagesContainer.addEventListener("scroll", event => syncScroll(messagesContainer, stickyContainer));
stickyContainer.addEventListener("scroll", event => syncScroll(stickyContainer, messagesContainer));