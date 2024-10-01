const messagesContainer = document.getElementById("messages");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

async function sendMessage(event) {
	//Avoid submitting form
	event.preventDefault();
	//Get user submission
	const prompt = inputField.value;
	//Check if empty
	if(prompt.trim() == "") {
		//Warn user of empty prompt
		alert("Prompt is empty");
		return;
	}
	//Add prompt to messages container
	messagesContainer.innerHTML += `User: ${prompt}<br>`;
	//Reset input field
	inputField.value = "";
	//Send post request and await response
	const response = await fetch("/chat", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			message: prompt
		})
	});
	//Get response message
	const {message} = await response.json();
	//Log message
	console.log(response);
	//Add response message to messages container
	messagesContainer.innerHTML += `Bot: ${message}<br>`;
}

sendBtn.addEventListener("click", sendMessage);
inputField.addEventListener("keypress", (event) => {
	if(event.key === "Enter") {
		sendBtn.click();
	}
});
