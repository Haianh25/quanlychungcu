import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import ResidentHeader from './ResidentHeader';
import ResidentFooter from './ResidentFooter';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const ResidentLayout = () => {
    // --- CHAT STATE ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('support'); // 'support' or 'ai'
    
    // Admin Chat Data
    const [messages, setMessages] = useState([]);
    const [adminInfo, setAdminInfo] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // AI Chat Data
    const [aiMessages, setAiMessages] = useState([
        { sender: 'ai', message: 'Xin chào! Tôi là trợ lý ảo AI. Bạn cần giúp gì không?' }
    ]);
    const [isAiTyping, setIsAiTyping] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, aiMessages, isChatOpen, activeTab, isAiTyping]);

    // --- SOCKET INIT ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser(decoded);

                const newSocket = io("http://localhost:5000", {
                    auth: { token: token }
                });

                newSocket.on('connect', () => {
                    console.log("Chat Socket connected");
                    newSocket.emit('find_admin_to_chat');
                });

                newSocket.on('admin_info', (admin) => {
                    setAdminInfo(admin);
                    newSocket.emit('get_conversation', { partner_id: admin.id });
                });

                // ADMIN MESSAGE RECEIVE
                newSocket.on('receive_message', (msg) => {
                    const myId = decoded.id || decoded.user?.id;
                    const isFromOther = msg.sender_id !== myId;

                    if (isFromOther && (!isChatOpen || activeTab !== 'support')) {
                         setUnreadCount(prev => prev + 1);
                    }
                    setMessages((prev) => [...prev, msg]);
                });

                newSocket.on('conversation_history', (history) => {
                    setMessages(history);
                });

                // AI MESSAGE RECEIVE
                newSocket.on('receive_ai_message', (response) => {
                    setIsAiTyping(false);
                    setAiMessages(prev => [...prev, { sender: 'ai', message: response.message }]);
                });

                setSocket(newSocket);

                return () => newSocket.disconnect();
            } catch (e) {
                console.error("Chat init error", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        if (activeTab === 'support') {
            if (!adminInfo) return;
            socket.emit('send_message', {
                receiver_id: adminInfo.id,
                message: newMessage
            });
        } else {
            // AI CHAT Logic
            setAiMessages(prev => [...prev, { sender: 'me', message: newMessage }]);
            setIsAiTyping(true);
            socket.emit('chat_with_ai', { message: newMessage });
        }
        setNewMessage('');
    };

    const toggleChat = () => {
        const newState = !isChatOpen;
        setIsChatOpen(newState);
        
        if (newState && activeTab === 'support' && adminInfo && socket) {
            setUnreadCount(0);
            socket.emit('mark_read', { sender_id: adminInfo.id });
        }
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab === 'support' && adminInfo && socket) {
            setUnreadCount(0);
            socket.emit('mark_read', { sender_id: adminInfo.id });
        }
    };

    return (
        <div className="homepage-container" style={{ position: 'relative' }}> 
            <ResidentHeader />
            <main className="main-content">
                <Outlet /> 
            </main>
            <ResidentFooter />

            {/* --- CHAT WIDGET --- */}
            {currentUser && (
                <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
                    {/* Chat Box */}
                    {isChatOpen && (
                        <div style={{
                            width: '350px',
                            height: '450px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: '15px',
                            overflow: 'hidden',
                            border: '1px solid #e0e0e0'
                        }}>
                            {/* Header Tabs */}
                            <div style={{ backgroundColor: '#2c3e50', display: 'flex' }}>
                                <div 
                                    onClick={() => switchTab('support')}
                                    style={{ 
                                        flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer',
                                        color: activeTab === 'support' ? 'white' : '#bdc3c7',
                                        fontWeight: activeTab === 'support' ? 'bold' : 'normal',
                                        borderBottom: activeTab === 'support' ? '3px solid #3498db' : 'none',
                                        backgroundColor: activeTab === 'support' ? '#34495e' : 'transparent'
                                    }}
                                >
                                    <i className="bi bi-headset me-2"></i>Admin
                                </div>
                                <div 
                                    onClick={() => switchTab('ai')}
                                    style={{ 
                                        flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer',
                                        color: activeTab === 'ai' ? 'white' : '#bdc3c7',
                                        fontWeight: activeTab === 'ai' ? 'bold' : 'normal',
                                        borderBottom: activeTab === 'ai' ? '3px solid #9b59b6' : 'none',
                                        backgroundColor: activeTab === 'ai' ? '#34495e' : 'transparent'
                                    }}
                                >
                                    <i className="bi bi-stars me-2"></i>AI Bot
                                </div>
                                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#ecf0f1', padding: '0 15px', fontSize: '1.2rem' }}>&times;</button>
                            </div>

                            {/* Messages Area */}
                            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', backgroundColor: activeTab === 'ai' ? '#f3e5f5' : '#f8f9fa' }}>
                                
                                {/* --- ADMIN CHAT UI --- */}
                                {activeTab === 'support' && (
                                    <>
                                        {!adminInfo && <div className="text-center text-muted mt-3">Connecting to support...</div>}
                                        {messages.map((msg, index) => {
                                            const currentUserId = currentUser.id || currentUser.user?.id;
                                            const isMe = msg.sender_id === currentUserId;
                                            return (
                                                <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                                                    <div style={{
                                                        maxWidth: '75%', padding: '8px 12px', borderRadius: '15px',
                                                        backgroundColor: isMe ? '#007bff' : '#e9ecef',
                                                        color: isMe ? 'white' : 'black', fontSize: '0.9rem'
                                                    }}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {/* --- AI CHAT UI --- */}
                                {activeTab === 'ai' && (
                                    <>
                                        {aiMessages.map((msg, index) => (
                                            <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                                                {msg.sender === 'ai' && <i className="bi bi-robot me-2 mt-1" style={{color: '#9b59b6'}}></i>}
                                                <div style={{
                                                    maxWidth: '80%', padding: '8px 12px', borderRadius: '15px',
                                                    backgroundColor: msg.sender === 'me' ? '#9b59b6' : 'white',
                                                    color: msg.sender === 'me' ? 'white' : '#333', 
                                                    fontSize: '0.9rem',
                                                    boxShadow: msg.sender === 'ai' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                                }}>
                                                    {msg.message}
                                                </div>
                                            </div>
                                        ))}
                                        {isAiTyping && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                                                <i className="bi bi-robot me-2 mt-1" style={{color: '#9b59b6'}}></i>
                                                <div style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '15px', fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
                                                    Thinking...
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #dee2e6', display: 'flex', backgroundColor: 'white' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={activeTab === 'support' ? "Message Admin..." : "Ask AI anything..."}
                                    disabled={activeTab === 'support' && !adminInfo}
                                    style={{ flex: 1, border: '1px solid #ced4da', borderRadius: '20px', padding: '8px 15px', outline: 'none' }}
                                />
                                <button type="submit" disabled={activeTab === 'support' && !adminInfo} 
                                    style={{ 
                                        marginLeft: '10px', border: 'none', borderRadius: '50%', width: '40px', height: '40px', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: activeTab === 'support' ? '#007bff' : '#9b59b6', 
                                        color: 'white' 
                                    }}>
                                    <i className="bi bi-send-fill" style={{ fontSize: '1rem' }}></i>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button 
                        onClick={toggleChat}
                        style={{
                            width: '60px', height: '60px', borderRadius: '50%', border: 'none',
                            backgroundColor: activeTab === 'ai' ? '#9b59b6' : '#007bff',
                            color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative', transition: 'background-color 0.3s'
                        }}
                    >
                        {isChatOpen ? <i className="bi bi-x-lg"></i> : <i className="bi bi-chat-dots-fill"></i>}
                        
                        {!isChatOpen && unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '0', right: '0',
                                backgroundColor: 'red', color: 'white',
                                borderRadius: '50%', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold', border: '2px solid white'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResidentLayout;