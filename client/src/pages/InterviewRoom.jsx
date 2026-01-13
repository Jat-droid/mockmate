import React, { useState, useEffect, useRef } from 'react';
import api from '../api'
import { FaPaperPlane, FaMicrophone, FaStopCircle, FaCompass, FaHistory, FaPlus, FaBars, FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const InterviewRoom = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  
  // Sidebar State
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Toggle for mobile/desktop
  
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // 1. Load History on Mount
  useEffect(() => {
    if (!userId) {
      navigate('/'); // Kick out if not logged in
      return;
    }
    fetchHistory();
    // Start with a welcome message if no ID
    setMessages([{ role: 'model', content: "Hello! I'm ready. What topic shall we discuss?" }]);
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`http://localhost:5000/api/ai/history/${userId}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  // 2. Load Old Chat when clicked
  const loadChat = async (id) => {
    setLoading(true);
    setInterviewId(id);
    try {
      const res = await api.get(`http://localhost:5000/api/ai/chat/${id}`);
      setMessages(res.data.messages);
      if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile
    } catch (err) {
      console.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  // 3. Start New Chat
  const startNewChat = () => {
    setInterviewId(null);
    setMessages([{ role: 'model', content: "Starting a new session. What's on your mind?" }]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // ... (Keep existing scroll & voice logic) ...
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        userId, topic: "General", message: userMsg.content, interviewId
      });

      const replyText = res.data.reply;
      setMessages(prev => [...prev, { role: 'model', content: replyText }]);
      
      if (res.data.interviewId) {
        setInterviewId(res.data.interviewId);
        if (!interviewId) fetchHistory(); // Refresh sidebar if this was a new chat
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "⚠️ Error connecting." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-gray-200 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#1e1f20] transition-all duration-300 flex flex-col border-r border-[#2f2f2f] overflow-hidden`}>
        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-3 bg-[#2f2f2f] hover:bg-[#383838] text-gray-200 px-4 py-3 rounded-full w-full transition shadow-sm text-sm font-medium"
          >
            <FaPlus className="text-gray-400" /> New chat
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="text-xs font-semibold text-gray-500 px-4 mb-2 mt-2">Recent</div>
          {history.map((chat) => (
            <div 
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer text-sm truncate transition ${
                interviewId === chat._id ? 'bg-[#004a77] text-blue-200' : 'hover:bg-[#2f2f2f] text-gray-300'
              }`}
            >
              <FaHistory className="text-xs flex-shrink-0 opacity-50" />
              <span className="truncate">{chat.topic || "New Conversation"}</span>
            </div>
          ))}
        </div>
        
        {/* User Profile (Logout) */}
        <div className="p-4 border-t border-[#2f2f2f]">
          <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
               {/* Get first letter of user ID as placeholder */}
               V
             </div>
             <div className="flex-1">Virat</div>
             <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-xs hover:text-red-400">Log out</button>
          </div>
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header (Mobile Toggle) */}
        <div className="p-4 flex items-center justify-between text-gray-400">
           <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#2f2f2f] rounded-full text-gray-300">
               {sidebarOpen ? <FaTimes /> : <FaBars />}
             </button>
             <span className="text-xl font-medium text-white tracking-tight">MockMate</span>
             <span className="text-xs bg-[#2f2f2f] px-2 py-0.5 rounded text-gray-300">Gemini 2.0</span>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="max-w-3xl mx-auto space-y-6 py-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-[#282a2c] text-white px-5 py-3 rounded-[2rem] max-w-[85%] text-[15px] leading-7">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex gap-4 w-full">
                     <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                        <FaCompass className="text-blue-400 text-xl animate-pulse" />
                     </div>
                     <div className="prose prose-invert max-w-none w-full">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-medium text-white mt-4 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-medium text-white mt-4 mb-2" {...props} />,
                            p: ({node, ...props}) => <p className="text-gray-300 mb-3 text-[16px] leading-7" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-300" {...props} />,
                            code: ({node, inline, className, children, ...props}) => inline 
                              ? <code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                              : <div className="my-4 rounded-xl overflow-hidden bg-[#1e1f20] border border-[#444746]"><div className="bg-[#2f2f2f] px-4 py-1.5 text-xs text-gray-400 font-mono">Code</div><div className="p-4 overflow-x-auto"><code className="text-sm font-mono text-blue-200 block" {...props}>{children}</code></div></div>
                          }}
                        >{msg.content}</ReactMarkdown>
                     </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="flex gap-4 w-full ml-12 text-gray-400 text-sm">Thinking...</div>}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 pb-6 bg-[#131314]">
          <div className="max-w-3xl mx-auto bg-[#1e1f20] rounded-full flex items-center px-2 py-2 border border-transparent focus-within:border-gray-600 focus-within:bg-[#282a2c] transition-all duration-300">
            <div className="p-2 ml-2 bg-[#2f2f2f] rounded-full text-white cursor-pointer hover:bg-gray-600 transition"><FaPlus /></div>
            <input type="text" className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 text-lg h-10" placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
            <div className="flex items-center space-x-2 pr-2">
               {input.trim() && <button onClick={sendMessage} className="p-3 rounded-full bg-white text-black hover:bg-gray-200 transition"><FaPaperPlane /></button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;