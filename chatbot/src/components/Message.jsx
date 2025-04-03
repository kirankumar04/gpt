const Message = ({ msg }) => {
    return (
      <div
        className={`mb-5 p-2 rounded max-w-full mt-3 ${
          msg.sender === "user" ? "bg-blue-600 self-end text-left ml-auto" : "bg-gray-700 self-start text-left mr-auto"
        }`}
      >
        {msg.text}
      </div>
    );
  };
  
  export default Message;