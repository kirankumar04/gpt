import { FaPaperclip, FaArrowRight } from "react-icons/fa";

const InputArea = ({ input, setInput, handleSendMessage, handleFileUpload, handleScrapeUrl, isLoading, chatDetails, activeChat }) => {
  return (
    <>
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
    </>
  );
};

export default InputArea;