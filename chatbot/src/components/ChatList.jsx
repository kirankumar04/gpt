import { FaTrash } from "react-icons/fa";

const ChatList = ({ chats, selectChat, deleteChat }) => {
  return (
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
  );
};

export default ChatList;