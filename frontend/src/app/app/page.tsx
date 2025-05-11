"use client";

import { useEffect, useRef, useState } from "react";

// This how to format when we get message from the ws
// await connection.send_json({
//                 "type": type.value,
//                 "content": message,
//             })

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Event | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    const token = localStorage.getItem("token") || ""; // Retrieve token from local storage
    const socket = new WebSocket(`ws://localhost:8000/pyre?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError(error as Event);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  function sendMessage() {
    if (socketRef.current && inputValue) {
      socketRef.current.send(inputValue);
      setInputValue("");
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">WebSocket Chat</h1>
      </header>
      <main className="flex-grow flex flex-col p-4 overflow-hidden">
        <div className="flex-grow overflow-y-auto bg-gray-700 rounded-lg p-4 shadow-inner space-y-4">
          {messages.map((message, index) => {
            const parsedMessage = JSON.parse(message);
            switch (parsedMessage.type) {
              case "message":
          return (
            <div
              key={index}
              className="flex items-start space-x-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-4 rounded-lg shadow-lg text-white"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold">
            {parsedMessage.username?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="font-bold text-lg">{parsedMessage.username}</p>
                <p className="text-sm">{parsedMessage.content}</p>
              </div>
            </div>
          );
              case "user_left":
          return (
            <div
              key={index}
              className="flex items-center justify-center bg-red-600 p-2 rounded-lg shadow-md text-white font-semibold"
            >
              🚪 {parsedMessage.username} has left the chat
            </div>
          );
              case "user_joined":
          return (
            <div
              key={index}
              className="flex items-center justify-center bg-green-600 p-2 rounded-lg shadow-md text-white font-semibold"
            >
              🎉 {parsedMessage.username} has joined the chat
            </div>
          );
              default:
          return (
            <div
              key={index}
              className="bg-gray-800 p-2 rounded-lg shadow-md text-white"
            >
              {message}
            </div>
          );
            }
          })}
        </div>
        <div className="mt-4 flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md text-white font-semibold"
          >
            Send
          </button>
        </div>
      </main>
      <footer className="bg-gray-800 p-4 text-center text-sm text-gray-400">
        {isConnected ? "Connected" : "Disconnected"} | WebSocket Chat App
      </footer>
    </div>
  );
};

export default Page;
