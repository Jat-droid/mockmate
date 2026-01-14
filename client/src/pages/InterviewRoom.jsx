import React, { useState, useEffect, useRef } from 'react';
import api from '../api'; 
import { FaPaperPlane, FaMicrophone, FaStopCircle, FaCompass, FaHistory, FaPlus, FaBars ,FaChartBar } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const InterviewRoom = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  
  // Sidebar & Feedback State
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // --- VOICE SETUP ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (!userId) return navigate('/');
    fetchHistory();
    if (!interviewId) {
      setMessages([{ role: 'model', content: "Hello! I'm ready. What topic shall we discuss?" }]);
    }
  }, [userId]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(v => v.name.includes("Google US English"));
    if (googleVoice) utterance.voice = googleVoice;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognition) return alert("Browser not supported. Try Chrome.");
    setIsListening(true);
    recognition.start();
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/ai/history/${userId}`);
      setHistory(res.data);
    } catch (err) { console.error("History failed"); }
  };

  const loadChat = async (id) => {
    setLoading(true);
    setInterviewId(id);
    try {
      const res = await api.get(`/ai/chat/${id}`);
      setMessages(res.data.messages);
      if (res.data.feedback) setFeedback(res.data.feedback);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) { console.error("Load failed"); } 
    finally { setLoading(false); }
  };

  const startNewChat = () => {
    setInterviewId(null);
    setFeedback(null);
    setMessages([{ role: 'model', content: "Starting a new session. What's on your mind?" }]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

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
        userId, topic: "General Tech", message: userMsg.content, interviewId
      });

      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
      speak(reply);

      if (res.data.interviewId) {
        setInterviewId(res.data.interviewId);
        if (!interviewId) fetchHistory(); 
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "⚠️ Error connecting. Check Server Terminal." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/end', { interviewId });
      setFeedback(res.data);
      setShowModal(true);
    } catch (err) {
      alert("Failed to generate feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-gray-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#1e1f20] transition-all duration-300 flex flex-col border-r border-[#2f2f2f]`}>
        <div className="p-4">
          <button onClick={startNewChat} className="flex items-center gap-3 bg-[#2f2f2f] hover:bg-[#383838] px-4 py-3 rounded-full w-full transition text-sm">
            <FaPlus className="text-gray-400" /> New chat
          </button>
          <div className="px-4 mt-2">
  <button 
    onClick={() => navigate('/dashboard')}
    className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#2f2f2f] px-4 py-2 rounded-full w-full transition text-sm font-medium"
  >
    <FaChartBar /> Dashboard
  </button>
</div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {history.map((chat) => (
            <div key={chat._id} onClick={() => loadChat(chat._id)} className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer text-sm truncate transition ${interviewId === chat._id ? 'bg-[#004a77] text-blue-200' : 'hover:bg-[#2f2f2f]'}`}>
              <FaHistory className="text-xs opacity-50" />
              <span className="truncate">{chat.topic || "Conversation"}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#2f2f2f] text-sm text-gray-400 cursor-pointer hover:text-white" onClick={() => { localStorage.clear(); navigate('/'); }}>
           Log out
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="p-4 flex items-center justify-between text-gray-400 z-10 bg-[#131314]">
           <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#2f2f2f] rounded-full"><FaBars /></button>
             <span className="text-xl font-medium text-white">MockMate</span>
           </div>
           <button onClick={handleEndInterview} disabled={!interviewId || loading} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition">
             End Interview
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="max-w-3xl mx-auto space-y-6 py-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-[#282a2c] text-white px-5 py-3 rounded-[2rem] max-w-[85%]">{msg.content}</div>
                ) : (
                  <div className="flex gap-4 w-full">
                     <div className="mt-1 w-8 h-8 flex items-center justify-center"><FaCompass className="text-blue-400 text-xl animate-pulse" /></div>
                     <div className="prose prose-invert max-w-none w-full">
                        <ReactMarkdown components={{
                            code: ({node, inline, children, ...props}) => inline 
                              ? <code className="bg-[#2f2f2f] px-1 rounded text-sm" {...props}>{children}</code>
                              : <div className="my-4 bg-[#1e1f20] rounded-xl overflow-hidden border border-[#444746]"><div className="bg-[#2f2f2f] px-4 py-1 text-xs text-gray-400">Code</div><div className="p-4 overflow-x-auto"><code className="text-sm font-mono text-blue-200 block" {...props}>{children}</code></div></div>
                        }}>{msg.content}</ReactMarkdown>
                     </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="ml-12 text-gray-400 text-sm animate-pulse">Thinking...</div>}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* INPUT BAR WITH MIC */}
        <div className="p-4 pb-6 bg-[#131314]">
          <div className="max-w-3xl mx-auto bg-[#1e1f20] rounded-full flex items-center px-2 py-2 border border-transparent focus-within:border-gray-600 focus-within:bg-[#282a2c] transition-all duration-300">
            
            {/* MIC BUTTON */}
            <button 
                onClick={startListening}
                className={`p-3 rounded-full transition ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
            >
                {isListening ? <FaStopCircle /> : <FaMicrophone />}
            </button>

            <input 
                type="text" 
                className="flex-1 bg-transparent border-none focus:outline-none text-white px-2 text-lg h-10" 
                placeholder={isListening ? "Listening..." : "Ask anything..."}
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
            />
            
            {/* SEND BUTTON */}
            {input.trim() && (
                <button onClick={sendMessage} className="p-3 rounded-full bg-white text-black hover:bg-gray-200">
                    <FaPaperPlane />
                </button>
            )}
          </div>
        </div>

        {/* FEEDBACK MODAL */}
        {showModal && feedback && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1f20] border border-[#2f2f2f] w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-2xl font-bold text-white">Report Card</h2><p className="text-gray-400 text-sm mt-1">{feedback.summary}</p></div>
                <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-2xl font-bold">{feedback.score}/10</div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#2f2f2f]/50 p-4 rounded-xl border border-green-900/30">
                  <h3 className="text-green-400 font-semibold mb-3">✅ Strengths</h3>
                  <ul className="space-y-2 text-sm text-gray-300">{feedback.strengths?.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                </div>
                <div className="bg-[#2f2f2f]/50 p-4 rounded-xl border border-red-900/30">
                  <h3 className="text-red-400 font-semibold mb-3">⚠️ Improvements</h3>
                  <ul className="space-y-2 text-sm text-gray-300">{feedback.weaknesses?.map((w, i) => <li key={i}>• {w}</li>)}</ul>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;