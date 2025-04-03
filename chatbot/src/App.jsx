import { useState } from "react";
import { FaPlus, FaTrash, FaPaperclip, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatDetails, setChatDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false); // For loader
  const [isTyping, setIsTyping] = useState(false); // For typing indicator

  const createNewChat = () => {
    const newChat = { id: Date.now(), name: `New Chat ${chats.length + 1}` };
    setChats([newChat, ...chats]);
    setMessages({ ...messages, [newChat.id]: [] });
    setChatDetails({ ...chatDetails, [newChat.id]: { option: "", name: "" } });
    setActiveChat(newChat.id);
  };

  const selectChat = (chatId) => {
    setActiveChat(chatId);
  };

  const deleteChat = (chatId) => {
    setChats(chats.filter((chat) => chat.id !== chatId));
    const newMessages = { ...messages };
    delete newMessages[chatId];
    setMessages(newMessages);
    const newChatDetails = { ...chatDetails };
    delete newChatDetails[chatId];
    setChatDetails(newChatDetails);
    if (activeChat === chatId) setActiveChat(null);
  };

  const handleSendMessage = async () => {
    if (!activeChat || input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages({ ...messages, [activeChat]: [...(messages[activeChat] || []), userMessage] });
    setInput("");
    setIsTyping(true); // Show typing indicator while waiting for response

    try {
      setIsLoading(true); // Show loader
      const response = await fetch("http://localhost:5000/ask_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();

      setMessages((prevMessages) => ({
        ...prevMessages,
        [activeChat]: [
          ...prevMessages[activeChat],
          { sender: "bot", text: data.answer },
        ],
      }));
      setIsTyping(false); // Hide typing indicator
      setIsLoading(false); // Hide loader
    } catch (error) {
      setIsTyping(false); // Hide typing indicator
      setIsLoading(false); // Hide loader
      console.error("Error communicating with the backend:", error);
      toast.error("Error communicating with the backend");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && activeChat) {
      setChatDetails({ ...chatDetails, [activeChat]: { option: "File Upload", name: file.name } });

      const formData = new FormData();
      formData.append("file", file);
      try {
        setIsLoading(true); // Show loader
        const response = await fetch("http://localhost:5000/upload_pdf", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        toast.success(data.message); // Success toast
        setIsLoading(false); // Hide loader
      } catch (error) {
        toast.error("Error uploading file");
        console.error("Error uploading file:", error);
        setIsLoading(false); // Hide loader
      }
    }
  };

  const handleScrapeUrl = async (event) => {
    const url = event.target.previousSibling.value;
    if (url.trim() !== "" && activeChat) {
      setChatDetails({ ...chatDetails, [activeChat]: { option: "URL Input", name: url } });

      try {
        setIsLoading(true); // Show loader
        const response = await fetch("http://localhost:5000/scrape_url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        toast.success(data.message); // Success toast
        setIsLoading(false); // Hide loader
      } catch (error) {
        toast.error("Error scraping URL");
        console.error("Error scraping URL:", error);
        setIsLoading(false); // Hide loader
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-64 bg-gray-800 p-4">
        <h1 className="text-lg font-semibold text-center">GPT</h1>
        <button
          onClick={createNewChat}
          className="w-full mt-4 py-2 bg-blue-700 hover:bg-blue-800 rounded flex items-center justify-center cursor-pointer"
        >
          <FaPlus className="mr-2" />
          New Chat
        </button>
        <nav className="mt-4 space-y-2">
          {chats.map((chat) => (
            <div key={chat.id} className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 ">
              <button onClick={() => selectChat(chat.id)} className="flex-1 text-left cursor-pointer">
                {chat.name}
              </button>
              <button onClick={() => deleteChat(chat.id)} className="text-red-400 hover:text-red-300 cursor-pointer">
                <FaTrash />
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg relative">
          {activeChat &&
            messages[activeChat]?.map((msg, index) => (
              <div
                key={index}
                className={`mb-5 p-2 rounded max-w-full mt-3 ${
                  msg.sender === "user" ? "bg-blue-600 self-end text-left ml-auto" : "bg-gray-700 self-start text-left mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          {isTyping && (
            <div className="p-2 text-gray-400 text-sm">Typing...</div>
          )}
          {/* Loader Overlay */}
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
              <div className="loader"></div> {/* Customize the loader here */}
            </div>
          )}
        </div>

        {activeChat && !chatDetails[activeChat]?.option && (
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className="p-2 bg-gray-600 rounded-full hover:bg-gray-500 cursor-pointer">
              <FaPaperclip />
            </label>
            <input type="text" placeholder="Enter URL" className="bg-gray-700 px-3 py-2 rounded flex-1" disabled={isLoading} />
            <button
              onClick={handleScrapeUrl}
              className="mt-2 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 cursor-pointer"
              disabled={isLoading}
            >
              Scrape
            </button>
          </div>
        )}

        {activeChat && chatDetails[activeChat]?.option && (
          <>
            {/* <div className="mt-2 text-gray-400 text-sm">Selected Option: {chatDetails[activeChat].option}</div> */}
            <div className="mt-2 text-gray-400 text-sm">Selected: {chatDetails[activeChat].name}</div>
            <div className="mt-4 flex items-center bg-gray-700 rounded-md p-2 space-x-2">
              <input
                type="text"
                placeholder="enter your query"
                className="bg-transparent flex-1 px-2 outline-none text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500"
                disabled={isLoading}
              >
                <FaArrowRight className="cursor-pointer"/>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ToastContainer for showing toasts */}
      <ToastContainer />
    </div>
  );
}
