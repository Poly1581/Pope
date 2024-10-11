let inputField = document.getElementById("user-input");
let sendBtn = document.getElementById("send-btn");

function loggerRequest(type, name) {
	return {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			eventType: type,
			elementName: name,
			timestamp: new Date()
		})
	}
}

async function logEvent(type, name) {
	try {
		await fetch(loggerRequest(type, name));
	} catch (error) {
		console.log(`Error logging interaction: ${error}`);
	}
}

if(inputField) {
	inputField.addEventListener("mouseover", () => {
		logEvent("hover", "User Input");
	});
	inputField.addEventListener("focus", () => {
		logEvent("focus", "User Input");
	});
}

if(sendBtn) {
	sendBtn.addEventListener("mouseover", () => {
		logEvent("hover", "Send Button");
	});
	sendBtn.addEventListener("click", () => {
		logEvent("click", "Send Button");
	})
}