
  
  const joinRoomButton = document.getElementById("room-button");
        const messageInput = document.getElementById("message-input");
        const roomInput = document.getElementById("room-input");
        const form = document.getElementById("form");

        const socket = io();
        socket.on('connect', ()=>{
            displayMessage(`you connect with id : ${socket.id}`)
        })
        
        socket.on("receive-message", message => {
            displayMessage(message)
        })

        form.addEventListener("submit", e => {
            e.preventDefault();
            const message = messageInput.value;
            const room = roomInput.value; 

            if(message === "") return 
            displayMessage(message) // display the message after submit 
            socket.emit('send-message', message)

            messageInput.value = ""; // clear the input 

        })

        joinRoomButton.addEventListener("click", () => {
            const room = roomInput.value;

        })

        function displayMessage(message){
            const div = document.createElement("div");
            div.textContent = message;
            document.getElementById("message-container").append(div);
        }