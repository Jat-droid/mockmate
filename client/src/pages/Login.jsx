import React, { useState } from 'react';
import api from '../api'
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // 1. Save the Token (The Digital ID Card)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user.id);
      
      // 2. Go to Chat Room
      navigate('/chat');
      
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#131314] text-white">
      <div className="w-full max-w-md p-8 bg-[#1e1f20] rounded-2xl shadow-xl border border-[#2f2f2f]">
        <h2 className="text-3xl font-semibold text-center mb-6 tracking-tight">Welcome</h2>
        
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-3 bg-[#2f2f2f] rounded-lg border border-transparent focus:border-blue-500 focus:outline-none text-white transition"
              placeholder=""
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 bg-[#2f2f2f] rounded-lg border border-transparent focus:border-blue-500 focus:outline-none text-white transition"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition">
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;