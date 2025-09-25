import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We will create this file next for styling

// --- Configuration ---
// The URL of your FastAPI backend.
// When you deploy, you'll change this to your backend's public URL.
const API_URL = 'http://localhost:8000';

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call your backend's /api/upload endpoint
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { session_id, filename } = response.data;
      const newSession = {
        id: session_id,
        name: filename,
        messages: [{ sender: 'ai', text: `Hi! I'm ready to answer questions about ${filename}.` }],
      };
      
      // Add the new session and make it the active one
      setSessions(prevSessions => [...prevSessions, newSession]);
      setActiveSessionId(session_id);

    } catch (error) {
      console.error("Error creating session:", error);
      alert(`Failed to create session: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input so you can upload the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="sidebar-header">RAG Chat</h1>
        <button 
          className="upload-button" 
          onClick={() => fileInputRef.current.click()}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "+ New Chat"}
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
        <div className="session-tabs">
          {sessions.map(session => (
            <button
              key={session.id}
              className={`tab ${session.id === activeSessionId ? 'active' : ''}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {session.name}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {activeSession ? (
          <ChatBox 
            key={activeSession.id} // Add key to force re-mount on session change
            session={activeSession} 
            setSessions={setSessions}
          />
        ) : (
          <div className="welcome-screen">
            <h2>Welcome to your Personal RAG Chat</h2>
            <p>Click "+ New Chat" to upload a document and start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// A separate component for the chat logic to keep code organized
function ChatBox({ session, setSessions }) {
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isAiTyping) return;

    const userMessage = { sender: 'user', text: input };
    
    setSessions(prevSessions => prevSessions.map(s => 
      s.id === session.id ? { ...s, messages: [...s.messages, userMessage] } : s
    ));

    setInput('');
    setIsAiTyping(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        session_id: session.id,
        message: input,
      });
      
      // Handle the new response format
      if (response.data && response.data.answers && response.data.answers.length > 0) {
        const aiMessageText = response.data.answers[0];
        const aiMessage = { sender: 'ai', text: aiMessageText };
        
        setSessions(prevSessions => prevSessions.map(s => 
          s.id === session.id ? { ...s, messages: [...s.messages, aiMessage] } : s
        ));
      } else {
        throw new Error('No valid answer in response');
      }

    } catch (error) {
      console.error("Error chatting:", error);
      const errorMessage = {
        sender: 'ai',
        text: 'I apologize, but I couldn\'t process your request. Please try again.'
      };
      
      setSessions(prevSessions => prevSessions.map(s => 
        s.id === session.id ? { ...s, messages: [...s.messages, errorMessage] } : s
      ));
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="chat-box">
      <div className="messages-container">
        {session.messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        {isAiTyping && <div className="message ai typing"><span></span><span></span><span></span></div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the document..."
          disabled={isAiTyping}
        />
        <button type="submit" disabled={!input.trim() || isAiTyping}>Send</button>
      </form>
    </div>
  );
}

export default App;
