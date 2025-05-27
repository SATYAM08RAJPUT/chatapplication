import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";

const socket = io("https://chat-backend-52d6.onrender.com");

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const name = prompt("Enter your name:");
    setUsername(name || "Anonymous");
    socket.emit("join", name || "Anonymous");
  }, []);

  useEffect(() => {
    axios
      .get("https://chat-backend-52d6.onrender.com/messages")
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to fetch messages:", err));

    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user joined", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      socket.off("chat message");
      socket.off("user joined");
      socket.off("connect_error");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    socket.emit("chat message", {
      username,
      message: newMessage,
    });

    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage(newMessage + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prevState) => !prevState);
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">Chat App</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              msg.type === "info"
                ? "system"
                : msg.username === username
                ? "sender"
                : "receiver"
            }`}
          >
            <div className="message-text">{msg.message}</div>
            {msg.type !== "info" && (
              <div className="message-meta">
                <span>{msg.username}</span> |{" "}
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={toggleEmojiPicker}>😊</button>

        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
