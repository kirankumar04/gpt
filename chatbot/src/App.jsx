import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import InputArea from "./components/InputArea";

export default function App() {
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatDetails, setChatDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

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
    setMessages((prevMessages) => ({
      ...prevMessages,
      [activeChat]: [...(prevMessages[activeChat] || []), userMessage],
    }));
    setInput("");
    setIsTyping(true);

    try {
      setIsLoading(true);
      setTimeout(async () => {
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
        setIsTyping(false);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsTyping(false);
      setIsLoading(false);
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
        setIsLoading(true);
        const response = await fetch("http://localhost:5000/upload_pdf", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        toast.success(data.message);
        setIsLoading(false);
      } catch (error) {
        toast.error("Error uploading file");
        console.error("Error uploading file:", error);
        setIsLoading(false);
      }
    }
  };

  const handleScrapeUrl = async (event) => {
    const url = event.target.previousSibling.value;
    if (url.trim() !== "" && activeChat) {
      setChatDetails({ ...chatDetails, [activeChat]: { option: "URL Input", name: url } });

      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:5000/scrape_url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        toast.success(data.message);
        setIsLoading(false);
      } catch (error) {
        toast.error("Error scraping URL");
        console.error("Error scraping URL:", error);
        setIsLoading(false);
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
        <ChatList chats={chats} selectChat={selectChat} deleteChat={deleteChat} />
      </div>

      <div className="flex-1 flex flex-col p-6">
        <ChatWindow
          messages={messages}
          activeChat={activeChat}
          isTyping={isTyping}
          isLoading={isLoading}
        />
        {activeChat && (
          <InputArea
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            handleFileUpload={handleFileUpload}
            handleScrapeUrl={handleScrapeUrl}
            isLoading={isLoading}
            chatDetails={chatDetails}
            activeChat={activeChat}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}