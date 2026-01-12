import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const AdminLayout = () => {
    // --- ADMIN CHAT STATE ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const [chatPartners, setChatPartners] = useState([]);
    
    // State để hiển thị UI
    const [selectedPartner, setSelectedPartner] = useState(null);
    
    // Ref để dùng trong Socket Listener (Tránh việc Re-connect socket)
    const selectedPartnerRef = useRef(null); 

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [totalUnread, setTotalUnread] = useState(0);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatOpen, selectedPartner]);

    // --- SOCKET INIT ---
    useEffect(() => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser(decoded);

                // Chỉ kết nối 1 lần duy nhất khi mount component
                const newSocket = io("http://localhost:5000", {
                    auth: { token: token }
                });

                newSocket.on('connect', () => {
                    console.log("Admin Chat Socket connected");
                    newSocket.emit('get_chat_partners');
                });

                newSocket.on('chat_partners_list', (users) => {
                    setChatPartners(users);
                    const total = users.reduce((sum, u) => sum + parseInt(u.unread_count || 0), 0);
                    setTotalUnread(total);
                });

                newSocket.on('receive_message', (msg) => {
                    // Dùng Ref để check người đang chat hiện tại
                    const currentPartner = selectedPartnerRef.current;

                    // Nếu đang chat với người gửi tin -> Hiện tin nhắn
                    if (currentPartner && (msg.sender_id === currentPartner.id || msg.receiver_id === currentPartner.id)) {
                        setMessages((prev) => [...prev, msg]);
                        
                        // Nếu tin đến từ người đang chat -> Mark read ngay
                        if (msg.sender_id === currentPartner.id) {
                            newSocket.emit('mark_read', { sender_id: currentPartner.id });
                        }
                    } 
                    
                    // Luôn refresh danh sách bên trái để cập nhật chấm đỏ
                    newSocket.emit('get_chat_partners');
                });

                newSocket.on('conversation_history', (history) => {
                    setMessages(history);
                });

                setSocket(newSocket);
                return () => newSocket.disconnect();
            } catch (e) {
                console.error("Admin Chat init error", e);
            }
        }
    }, []); // Dependency rỗng -> Socket không bao giờ bị reset khi chọn user

    const handleSelectPartner = (user) => {
        // Cập nhật cả State và Ref
        setSelectedPartner(user);
        selectedPartnerRef.current = user;
        
        // UI trick: Xóa tạm số unread của user này
        setChatPartners(prev => prev.map(u => u.id === user.id ? {...u, unread_count: 0} : u));

        if (socket) {
            // Socket vẫn sống, gọi thoải mái
            socket.emit('get_conversation', { partner_id: user.id });
            socket.emit('mark_read', { sender_id: user.id });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !selectedPartner) return;

        socket.emit('send_message', {
            receiver_id: selectedPartner.id,
            message: newMessage
        });
        setNewMessage('');
    };

    return (
        <div style={{ backgroundColor: '#f8f6f3', minHeight: '100vh', position: 'relative' }}> 
            <AdminHeader />
            <div className="container-fluid"> 
                <div className="row">
                    <div className="col-md-3 col-lg-2 p-0 bg-white border-end" style={{minHeight: 'calc(100vh - 70px)'}}> 
                        <AdminSidebar />
                    </div>
                    <div className="col-md-9 col-lg-10 p-4 admin-content-wrapper main-content">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* --- ADMIN CHAT DRAWER --- */}
            {currentUser && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 }}>
                    {/* Chat Panel */}
                    {isChatOpen && (
                        <div style={{
                            width: '600px',
                            height: '500px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                            display: 'flex',
                            overflow: 'hidden',
                            marginBottom: '15px',
                            border: '1px solid #ddd'
                        }}>
                            {/* Left: User List */}
                            <div style={{ width: '220px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                                    Residents
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {chatPartners.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => handleSelectPartner(user)}
                                            style={{
                                                padding: '10px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedPartner?.id === user.id ? '#e3f2fd' : 'white',
                                                borderBottom: '1px solid #f1f1f1',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{overflow: 'hidden'}}>
                                                <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                    {user.full_name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{user.email}</div>
                                            </div>
                                            
                                            {parseInt(user.unread_count) > 0 && (
                                                <span style={{
                                                    backgroundColor: 'red',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    padding: '2px 6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    minWidth: '20px',
                                                    textAlign: 'center'
                                                }}>
                                                    {user.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {chatPartners.length === 0 && <div style={{padding: '10px', color: '#999', fontSize: '0.8rem'}}>No messages yet</div>}
                                </div>
                            </div>

                            {/* Right: Chat Area */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {selectedPartner ? (
                                    <>
                                        <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{selectedPartner.full_name}</span>
                                            <button onClick={() => setSelectedPartner(null)} style={{border:'none', background:'none', color:'#999'}}>Back</button>
                                        </div>
                                        
                                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#fff' }}>
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
                                                            backgroundColor: isMe ? '#4CAF50' : '#f1f1f1',
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

                                        <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex' }}>
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Reply..."
                                                style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}
                                            />
                                            <button type="submit" style={{ marginLeft: '10px', border: 'none', backgroundColor: '#4CAF50', color: 'white', borderRadius: '4px', padding: '0 15px' }}>
                                                Send
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                        Select a resident to chat
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Button */}
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="btn btn-primary"
                        style={{
                            borderRadius: '50px',
                            padding: '10px 20px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            position: 'relative'
                        }}
                    >
                        <i className="bi bi-chat-square-text-fill"></i>
                        {isChatOpen ? 'Close Chat' : 'Admin Chat'}

                        {!isChatOpen && totalUnread > 0 && (
                             <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: '2px solid white'
                            }}>
                                {totalUnread}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;