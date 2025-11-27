
const token = localStorage.getItem("token");
if (!token) {
  alert("Login required");
  window.location.href = "/login.html";
}

const currentUser = JSON.parse(atob(token.split('.')[1])).memberQid;
const socket = io("https://thebooksourcings.onrender.com", {
  auth: { token },
  transports: ["websocket"]
});

const roomList = document.getElementById("roomList");
const chatContent = document.getElementById("chatContent");
let activeRoomId = null;

// 🔹 Load Chat Rooms
async function loadChatRooms() {
  try {
    const res = await axios.get("https://thebooksourcings.onrender.com/api/chat/rooms", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rooms = res.data.rooms || [];
    roomList.innerHTML = "";

    if (!rooms.length) {
      roomList.innerHTML = `<p class='no-room'>No chats yet.</p>`;
      return;
    }

    rooms.forEach(room => {
      const div = document.createElement("div");
      div.className = "room-item";
      div.innerHTML = `
        <img src="${room.otherProfileImg || 'default.png'}" class="room-avatar">
        <div class="room-info">
          <p class="room-name">${room.otherUsername}</p>
          <p class="room-last">${room.lastMessage || 'No messages yet'}</p>
        </div>
      `;
      div.addEventListener("click", () => openRoom(room.roomId));
      roomList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load chat rooms:", err);
  }
}

// 🔹 Load Messages of Selected Room
async function openRoom(roomId) {
  activeRoomId = roomId;
  chatContent.innerHTML = `
    <div id="chatBox" class="chat-box"></div>
    <div class="chat-input">
      <input type="text" id="messageInput" placeholder="Type a message..." />
      <button id="sendBtn"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `;

  const chatBox = document.getElementById("chatBox");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  socket.emit("joinRoom", roomId);

  // Fetch and display chat history
  try {
    const res = await axios.get(`https://thebooksourcings.onrender.com/api/chat/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const messages = res.data.messages || [];
    chatBox.innerHTML = "";

    messages.forEach(msg => appendMessage(msg, msg.senderQid === currentUser));
    chatBox.scrollTop = chatBox.scrollHeight;

    // Mark as seen when room opened
    // socket.emit("messageSeen", { roomId });
    socket.emit("markRoomSeen", { roomId });

  } catch (err) {
    console.error("Failed to load messages:", err);
  }

sendBtn.onclick = () => {
  const text = messageInput.value.trim();
  if (!text) return;

  const tempId = "temp_" + Date.now();
  // show a pending UI that uses the tempId exactly
  appendMessage({ messageId: tempId, message: text, senderQid: currentUser, status: "pending" }, true);

  socket.emit("sendMessage", { roomId, message: text, tempId });
  messageInput.value = "";
};


}

// 🔹 Append message function (with status icon)
function appendMessage(msg, isMe = false) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = isMe ? "message me" : "message other";
  msgDiv.dataset.messageId = msg.messageId;

  const textSpan = document.createElement("span");
  textSpan.className = "message-text";
  textSpan.textContent = msg.message;
  msgDiv.appendChild(textSpan);

  // ✅ Add status icons for your messages only
  if (isMe) {
    const status = document.createElement("span");
    status.className = "status";
    status.style.marginLeft = "6px";

    if (msg.status === "pending") status.innerHTML = `<i class="fa-solid fa-clock"></i>`;
    else if (msg.status === "sent") status.innerHTML = `<i class="fa-solid fa-check"></i>`;
    else if (msg.status === "delivered") status.innerHTML = `<i class="fa-solid fa-check-double"></i>`;
    else if (msg.status === "seen") status.innerHTML = `<i class="fa-solid fa-check-double" style="color:#0d6efd"></i>`;

    msgDiv.appendChild(status);
  }

  // ⚙️ Add edit/delete for sender
  if (isMe) {
    const threeDots = document.createElement("span");
    threeDots.textContent = "⋮";
    threeDots.className = "three-dots";
    msgDiv.appendChild(threeDots);
    threeDots.addEventListener("click", () => showEditDeleteToast(msgDiv, msg.messageId));
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🔹 Update message status visually
function updateMessageStatus(messageId, status) {
  const msgDiv = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!msgDiv) return;
  const statusEl = msgDiv.querySelector(".status");
  if (!statusEl) return;

  if (status === "sent") statusEl.innerHTML = `<i class="fa-solid fa-check"></i>`;
  if (status === "delivered") statusEl.innerHTML = `<i class="fa-solid fa-check-double"></i>`;
  if (status === "seen") statusEl.innerHTML = `<i class="fa-solid fa-check-double" style="color:#0d6efd"></i>`;
}

// 🔹 Real-time message receiving
socket.on("receiveMessage", (msg) => {
  const isMe = msg.senderQid === currentUser;
  appendMessage(msg, isMe);

  if (!isMe) {
    // mark as delivered immediately
    socket.emit("messageDelivered", { messageId: msg.messageId, roomId: msg.roomId });

    // 🩵 Fix: when you’re already in same room, mark as seen immediately
    if (activeRoomId === msg.roomId && document.visibilityState === "visible") {
      socket.emit("markRoomSeen", { roomId: msg.roomId });
    }
  }
});

// 🔹 Message seen updates (make all blue)
socket.on("messageSeen", ({ messageId, roomId }) => {
  if (roomId !== activeRoomId) return;
  updateMessageStatus(messageId, "seen");
});

socket.on("messageSent", (msg) => {
  // server includes tempId if client sent one
  const { tempId } = msg || {};
  if (tempId) {
    // find the exact element with that tempId
    const tempMsg = document.querySelector(`[data-message-id="${tempId}"]`);
    if (tempMsg) {
      tempMsg.dataset.messageId = msg.messageId; // replace id
      const statusEl = tempMsg.querySelector(".status");
      if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check"></i>`; // sent
      return;
    }
  }

  // fallback — append the saved message if we didn't find a temp element
  appendMessage(msg, msg.senderQid === currentUser);
});



// 🔹 Delivered confirmation
socket.on("messageDelivered", ({ messageIds }) => {
  if (!Array.isArray(messageIds)) return;
  messageIds.forEach(id => updateMessageStatus(id, "delivered"));
});


// 🔹 Edit / Delete logic remains same
socket.on("messageEdited", (data) => {
  const msgDiv = document.querySelector(`[data-message-id="${data.messageId}"]`);
  if (msgDiv) msgDiv.querySelector(".message-text").textContent = data.newMessage;
});

socket.on("messageDeleted", (data) => {
  const msgDiv = document.querySelector(`[data-message-id="${data.messageId}"]`);
  if (msgDiv) msgDiv.remove();
});

socket.on("roomMessagesSeen", ({ messageIds }) => {
  if (!Array.isArray(messageIds)) return;
  messageIds.forEach(id => updateMessageStatus(id, "seen"));
});


// ---------- Toast logic ----------
function showEditDeleteToast(msgDiv, messageId) {
  const toast = document.getElementById("editDeleteToast");
  toast.style.display = "block";

  const editBtn = toast.querySelector("#editBtn");
  const deleteBtn = toast.querySelector("#deleteBtn");
  const closeBtn = toast.querySelector("#closeToast");

  editBtn.onclick = () => {
    toast.style.display = "none";
    showEditMessageToast(msgDiv, messageId);
  };
  deleteBtn.onclick = () => {
    toast.style.display = "none";
    showDeleteMessageToast(messageId);
  };
  closeBtn.onclick = () => {
    toast.style.display = "none";
  };
}

function showEditMessageToast(msgDiv, messageId) {
  const toast = document.getElementById("editMessageToast");
  const input = toast.querySelector("#editInput");
  const submit = toast.querySelector("#submitEdit");
  const cancel = toast.querySelector("#cancelEdit");

  input.value = msgDiv.querySelector(".message-text").textContent;
  toast.style.display = "block";

  submit.onclick = () => {
    const newMessage = input.value.trim();
    if (!newMessage) return;
    socket.emit("editMessage", { roomId: activeRoomId, messageId, newMessage });
    toast.style.display = "none";
  };
  cancel.onclick = () => (toast.style.display = "none");
}

function showDeleteMessageToast(messageId) {
  const toast = document.getElementById("deleteMessageToast");
  const confirm = toast.querySelector("#confirmDelete");
  const cancel = toast.querySelector("#cancelDelete");

  toast.style.display = "block";
  confirm.onclick = () => {
    socket.emit("deleteMessage", { roomId: activeRoomId, messageId });
    toast.style.display = "none";
  };
  cancel.onclick = () => (toast.style.display = "none");
}

loadChatRooms();
// 🔹 When user switches back to the chat tab, mark messages as seen
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && activeRoomId) {
    socket.emit("markRoomSeen", { roomId: activeRoomId });
  }
});
