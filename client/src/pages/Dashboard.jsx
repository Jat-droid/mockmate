import React, { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaTrophy, FaHistory } from 'react-icons/fa';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, bestTopic: '-' });
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) navigate('/');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/ai/history/${userId}`);
      const rawData = res.data;

      // 1. Process Data for Graph (Filter out chats with no scores)
      const graphData = rawData
        .filter(chat => chat.feedback?.score !== undefined)
        .map(chat => ({
          date: new Date(chat.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: chat.feedback.score,
          topic: chat.topic
        }))
        .reverse(); // Show oldest to newest on graph

      setData(graphData);

      // 2. Calculate Stats
      const total = rawData.length;
      const scoredChats = rawData.filter(c => c.feedback?.score);
      const avg = scoredChats.length 
        ? (scoredChats.reduce((acc, curr) => acc + curr.feedback.score, 0) / scoredChats.length).toFixed(1) 
        : 0;

      setStats({ total, avgScore: avg, bestTopic: 'General Tech' }); // Placeholder for best topic logic
    } catch (err) {
      console.error("Dashboard error");
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] text-white p-6 font-sans">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate('/chat')} className="p-2 bg-[#2f2f2f] rounded-full hover:bg-gray-600 transition">
             <FaArrowLeft />
           </button>
           <h1 className="text-2xl font-bold">Your Progress</h1>
        </div>
        <div className="text-sm text-gray-400">MockMate Analytics</div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#1e1f20] p-6 rounded-2xl border border-[#2f2f2f] flex items-center gap-4">
           <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl"><FaHistory size={24} /></div>
           <div>
             <div className="text-2xl font-bold">{stats.total}</div>
             <div className="text-sm text-gray-400">Interviews Completed</div>
           </div>
        </div>
        <div className="bg-[#1e1f20] p-6 rounded-2xl border border-[#2f2f2f] flex items-center gap-4">
           <div className="p-3 bg-green-900/30 text-green-400 rounded-xl"><FaChartLine size={24} /></div>
           <div>
             <div className="text-2xl font-bold">{stats.avgScore}/10</div>
             <div className="text-sm text-gray-400">Average Score</div>
           </div>
        </div>
        <div className="bg-[#1e1f20] p-6 rounded-2xl border border-[#2f2f2f] flex items-center gap-4">
           <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-xl"><FaTrophy size={24} /></div>
           <div>
             <div className="text-xl font-bold truncate max-w-[150px]">Top 10%</div>
             <div className="text-sm text-gray-400">Percentile</div>
           </div>
        </div>
      </div>

      {/* Graph Section */}
      <div className="max-w-5xl mx-auto bg-[#1e1f20] p-6 rounded-2xl border border-[#2f2f2f]">
        <h2 className="text-xl font-semibold mb-6 ml-2">Performance Trend</h2>
        
        {data.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
                <YAxis stroke="#9ca3af" domain={[0, 10]} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1f20', borderColor: '#2f2f2f', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                  dot={{ r: 4, fill: '#1e1f20', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500 flex-col">
            <p>No scored interviews yet.</p>
            <button onClick={() => navigate('/chat')} className="mt-2 text-blue-400 hover:underline text-sm">Start your first interview</button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;