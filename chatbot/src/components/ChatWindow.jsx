import Message from "./Message";

const ChatWindow = ({ messages, activeChat, isTyping }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg relative">
      {activeChat && messages[activeChat]?.map((msg, index) => (
        <Message key={index} msg={msg} />
      ))}
      {isTyping && (
        <div className="p-2 text-gray-400 text-sm">Typing...</div>
      )}
    </div>
  );
};

export default ChatWindow;