import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// --- Configuration ---
// The URL of your FastAPI backend.
// When you deploy, you'll change this to your backend's public URL.
const API_URL = 'https://affine-unflippant-bertram.ngrok-free.dev';

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar resizing
  const handleMouseDown = (e) => {
    if (isMobile) return;
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || isMobile) return;
    const newWidth = e.clientX;
    if (newWidth >= 250 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const uploadFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { session_id, filename } = response.data;
      const newSession = {
        id: session_id,
        name: filename,
        messages: [{ sender: 'ai', text: `Hi! I'm ready to answer questions about ${filename}.`, ts: new Date().toISOString() }],
      };

      setSessions(prevSessions => [...prevSessions, newSession]);
      setActiveSessionId(session_id);
    } catch (error) {
      console.error("Error creating session:", error);
      alert(`Failed to create session: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadUrl = async (url, title) => {
    if (!url.trim()) return;
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/upload-url`, {
        url: url.trim(),
        title: title.trim() || null
      });

      const { session_id, filename } = response.data;
      const newSession = {
        id: session_id,
        name: filename,
        messages: [{ sender: 'ai', text: `Hi! I'm ready to answer questions about ${filename}.`, ts: new Date().toISOString() }],
      };

      setSessions(prevSessions => [...prevSessions, newSession]);
      setActiveSessionId(session_id);
      setShowUrlInput(false);
      setUrlInput('');
      setUrlTitle('');
    } catch (error) {
      console.error("Error creating session:", error);
      alert(`Failed to create session: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    await uploadFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    await uploadFile(file);
  };
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="app-container" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button 
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="mobile-title">RAG Chat</h1>
          <div className="mobile-actions">
            <button 
              className="new-chat-mobile"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={isLoading}
            >
              {isLoading ? "..." : showUrlInput ? "📁" : "📄"}
            </button>
            <button 
              className="new-chat-mobile"
              onClick={() => fileInputRef.current.click()}
              disabled={isLoading}
            >
              {isLoading ? "..." : "+"}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar ${isMobile ? (sidebarOpen ? 'open' : 'closed') : ''}`}
        style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        ref={sidebarRef}
      >
        {!isMobile && (
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
          />
        )}
        
        <div className="sidebar-content">
          {!isMobile && (
            <div className="sidebar-header">
              <div className="header-left">
                <div className="logo">🤖</div>
                <h1>My Chats</h1>
              </div>
              <button className="menu-toggle">☰</button>
            </div>
          )}
          
          <div className="search-section">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search" className="search-input" />
            </div>
          </div>

          <div className="folders-section">
            <div className="section-header">
              <h3>Folders</h3>
              <div className="section-actions">
                <button className="action-btn">×</button>
                <button className="action-btn">⋯</button>
              </div>
            </div>
            <div className="folders-list">
              <div className="folder-item">
                <span className="folder-icon">📁</span>
                <span className="folder-name">Work chats</span>
                <button className="folder-menu">⋯</button>
              </div>
              <div className="folder-item">
                <span className="folder-icon">📁</span>
                <span className="folder-name">Life chats</span>
                <button className="folder-menu">⋯</button>
              </div>
              <div className="folder-item">
                <span className="folder-icon">📁</span>
                <span className="folder-name">Projects chats</span>
                <button className="folder-menu">⋯</button>
              </div>
              <div className="folder-item">
                <span className="folder-icon">📁</span>
                <span className="folder-name">Clients chats</span>
                <button className="folder-menu">⋯</button>
              </div>
            </div>
          </div>

          <div className="chats-section">
            <div className="section-header">
              <h3>Chats</h3>
              <div className="section-actions">
                <button className="action-btn">×</button>
              </div>
            </div>
            <div className="session-list">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <div className="session-icon">📄</div>
                  <div className="session-info">
                    <div className="session-name">{session.name}</div>
                    <div className="session-preview">
                      {session.messages[session.messages.length - 1]?.text?.substring(0, 50)}...
                    </div>
                  </div>
                  <button className="session-menu">⋯</button>
                </div>
              ))}
            </div>
          </div>

          <div className="upload-section">
            <button 
              className="new-chat-button" 
              onClick={() => {
                fileInputRef.current.click();
                if (isMobile) setSidebarOpen(false);
              }}
              disabled={isLoading}
            >
              <span className="new-chat-icon">+</span>
              <span>New chat</span>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Window */}
      <div className="chat-window">
        {isDragging && (
          <div className="dropzone">
            <p>Drop your document to start a new chat</p>
          </div>
        )}
        {activeSession ? (
          <ChatBox 
            key={activeSession.id}
            session={activeSession} 
            setSessions={setSessions}
            isMobile={isMobile}
            onRename={(newName) => {
              setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, name: newName } : s));
            }}
            onDelete={() => {
              setSessions(prev => prev.filter(s => s.id !== activeSession.id));
              setActiveSessionId(prev => (prev === activeSession.id ? (sessions.find(s => s.id !== activeSession.id)?.id ?? null) : prev));
            }}
          />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-header">
              <div className="welcome-title">
                <span className="back-arrow">←</span>
                <span>Name chat</span>
                <div className="model-badge">Chat GPT 4.4</div>
              </div>
              <div className="header-actions">
                <button className="header-btn">ℹ</button>
                <button className="header-btn">⛶</button>
              </div>
            </div>
            
            <div className="welcome-content">
              <div className="greeting-card">
                <div className="greeting-logo">🤖</div>
                <h2>How can I help you today?</h2>
                <p>This code will display a prompt asking the user for their name, and then it will display a greeting message with the name entered by the user</p>
              </div>
              
              <div className="suggestion-cards">
                <div className="suggestion-card">
                  <div className="card-icon">📄</div>
                  <div className="card-content">
                    <h4>Saved Prompt Templates</h4>
                    <p>Access your saved prompts</p>
                  </div>
                </div>
                
                <div className="suggestion-card">
                  <div className="card-icon">🎵</div>
                  <div className="card-content">
                    <h4>Media Type Selection</h4>
                    <p>Choose your media type</p>
                  </div>
                </div>
                
                <div className="suggestion-card">
                  <div className="card-icon">🌍</div>
                  <div className="card-content">
                    <h4>Multilingual Support</h4>
                    <p>Chat in multiple languages</p>
                  </div>
                </div>
              </div>
              
              <div className="content-tabs">
                <button className="tab active">All</button>
                <button className="tab">Text</button>
                <button className="tab">Image</button>
                <button className="tab">Video</button>
                <button className="tab">Music</button>
                <button className="tab">Analytics</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A separate component for the chat logic to keep code organized
function ChatBox({ session, setSessions, onRename, onDelete, isMobile }) {
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  // Handle scroll events to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
      
      // Calculate scroll progress
      const progress = Math.min(scrollTop / (scrollHeight - clientHeight), 1);
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isAiTyping) return;

    const userMessage = { sender: 'user', text: input, ts: new Date().toISOString() };
    
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
        const aiMessage = { sender: 'ai', text: aiMessageText, ts: new Date().toISOString() };
        
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
        text: 'I apologize, but I couldn\'t process your request. Please try again.',
        ts: new Date().toISOString()
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
      {!isMobile && (
        <div className="chat-header">
          <div className="session-title">{session.name}</div>
          <div className="header-actions">
            <button onClick={() => {
              const name = prompt('Rename chat', session.name);
              if (name && name.trim()) onRename(name.trim());
            }}>Rename</button>
            <button className="danger" onClick={onDelete}>Delete</button>
          </div>
        </div>
      )}
      <div className="messages-container" ref={messagesContainerRef}>
        {/* Scroll progress indicator */}
        <div 
          className="scroll-indicator" 
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
        
        {session.messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            <div className="meta">
              <span>{new Date(msg.ts ?? Date.now()).toLocaleTimeString()}</span>
              {msg.sender === 'ai' && (
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(msg.text)}>Copy</button>
              )}
            </div>
          </div>
        ))}
        {isAiTyping && <div className="message ai typing"><span></span><span></span><span></span></div>}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button 
            className="scroll-to-bottom visible"
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            ↓
          </button>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="chat-form">
        <div className="input-container">
          <div className="input-logo">🤖</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your prompt here..."
            disabled={isAiTyping}
            className="chat-input"
          />
          <div className="input-actions">
            <button type="button" className="voice-btn" title="Voice input">🎤</button>
            <button type="submit" disabled={!input.trim() || isAiTyping} className="send-btn">
              →
            </button>
          </div>
        </div>
        <div className="disclaimer">
          ChatGPT can make mistakes. Consider checking important information.
        </div>
      </form>
    </div>
  );
}

export default App;
