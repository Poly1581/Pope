// Step 1: Add 3 constant variables inputField, sendBtn, and messagesContainer
// These variables should retrieve elements by their IDs from the HTML

// Step 2: Add a sendMessage() function to handle sending messages
//  - Retrieve the user input from the input field and remove whitespace
//  - Check if the input is empty, and if so, display an alert
//  - If not empty, create a new message element and display it in the chat window
//  - Clear the input field after the message is displayed

// Step 3: Add an event listener to the sendBtn to trigger sendMessage() when clicked

// Step 4: Add an event listener to the inputField to allow the "Enter" key to send the message 

const messagesContainer = document.getElementById("messages");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function sendMessage() {
	const prompt = inputField.value;
	if(prompt.trim() == "") {
		window.alert("Prompt is empty.");
		return;
	}
	messagesContainer.textContent += prompt;
	inputField.textContent = "";
}

sendBtn.addEventListener("click", sendMessage);
inputField.addEventListener("keypress", (event) => {
	if(press.key == "Enter") {
		event.preventDefault();
		sendBtn.click();
	}
});
