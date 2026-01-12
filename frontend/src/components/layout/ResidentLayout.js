import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import ResidentHeader from './ResidentHeader';
import ResidentFooter from './ResidentFooter';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const ResidentLayout = () => {
    // --- CHAT STATE ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [adminInfo, setAdminInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0); // <--- Biến đếm tin chưa đọc
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen]);

    // --- SOCKET INIT FOR CHAT ---
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

                newSocket.on('receive_message', (msg) => {
                    const myId = decoded.id || decoded.user?.id;
                    const isFromOther = msg.sender_id !== myId;

                    // Nếu tin nhắn từ người khác và mình đang ĐÓNG chat -> Tăng biến đếm
                    if (isFromOther && !isChatOpen) {
                         setUnreadCount(prev => prev + 1);
                    }

                    setMessages((prev) => [...prev, msg]);
                });

                newSocket.on('conversation_history', (history) => {
                    setMessages(history);
                });

                setSocket(newSocket);

                return () => newSocket.disconnect();
            } catch (e) {
                console.error("Chat init error", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isChatOpen]); // Dependency isChatOpen quan trọng để check trạng thái đóng/mở

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !adminInfo) return;

        socket.emit('send_message', {
            receiver_id: adminInfo.id,
            message: newMessage
        });
        setNewMessage('');
    };

    const toggleChat = () => {
        const newState = !isChatOpen;
        setIsChatOpen(newState);
        
        // Nếu MỞ chat -> Xóa biến đếm và đánh dấu đã đọc
        if (newState && adminInfo && socket) {
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
                            width: '320px',
                            height: '400px',
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: '15px',
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    <i className="bi bi-headset me-2"></i> 
                                    {adminInfo ? 'Support Admin' : 'Connecting...'}
                                </div>
                                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}>&times;</button>
                            </div>

                            {/* Messages Area */}
                            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                                {messages.map((msg, index) => {
                                    const currentUserId = currentUser.id || currentUser.user?.id;
                                    const isMe = msg.sender_id === currentUserId;
                                    
                                    return (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{
                                                maxWidth: '70%',
                                                padding: '8px 12px',
                                                borderRadius: '15px',
                                                backgroundColor: isMe ? '#007bff' : '#e9ecef',
                                                color: isMe ? 'white' : 'black',
                                                fontSize: '0.9rem'
                                            }}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #dee2e6', display: 'flex' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={!adminInfo}
                                    style={{ flex: 1, border: '1px solid #ced4da', borderRadius: '20px', padding: '5px 15px', outline: 'none' }}
                                />
                                <button type="submit" disabled={!adminInfo} style={{ marginLeft: '10px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-send-fill" style={{ fontSize: '0.9rem' }}></i>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button 
                        onClick={toggleChat}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative' // Để đặt badge
                        }}
                    >
                        {isChatOpen ? <i className="bi bi-x-lg"></i> : <i className="bi bi-chat-dots-fill"></i>}
                        
                        {/* --- CHẤM ĐỎ THÔNG BÁO --- */}
                        {!isChatOpen && unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '2px 8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: '2px solid white'
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