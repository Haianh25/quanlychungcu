// frontend/src/pages/admin/VehicleManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Table, Button, Spinner, Alert, Modal, Image, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';

// Import icons nếu bạn dùng react-bootstrap-icons: npm install react-bootstrap-icons
import { PencilFill, PauseCircleFill, PlayCircleFill } from 'react-bootstrap-icons';


const API_BASE_URL = 'http://localhost:5000';

// --- (Component Edit Modal) ---
// Hàm helper đặt bên ngoài component chính nếu không cần truy cập state/props của nó
const getVehicleTypeText = (type) => ({ car: 'Ô tô', motorbike: 'Xe máy', bicycle: 'Xe đạp' }[type] || type);

const EditCardModal = ({ show, handleClose, cardData, onSave, loading }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (cardData) {
            setFormData({
                card_user_name: cardData.card_user_name || '',
                license_plate: cardData.license_plate || '',
                brand: cardData.brand || '',
                color: cardData.color || ''
            });
            setError('');
        }
    }, [cardData]);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSaveChanges = async () => {
         setError('');
        if (!formData.card_user_name || !formData.brand || !formData.color) { setError('Tên người dùng, nhãn hiệu, màu xe là bắt buộc.'); return; }
        if (cardData && cardData.vehicle_type !== 'bicycle' && !formData.license_plate) { setError('Biển số là bắt buộc cho ô tô/xe máy.'); return; }
        if(cardData) {
            onSave(cardData.id, formData);
        }
    };

     return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>Chỉnh sửa Thẻ xe #{cardData?.id}</Modal.Title></Modal.Header>
            <Modal.Body>
                {cardData ? (
                    <Form>
                         <Form.Group className="mb-3"><Form.Label>Loại xe</Form.Label><Form.Control type="text" value={getVehicleTypeText(cardData.vehicle_type)} disabled readOnly /></Form.Group> {/* Sử dụng helper */}
                         <Form.Group className="mb-3"><Form.Label>Tên người dùng thẻ</Form.Label><Form.Control type="text" name="card_user_name" value={formData.card_user_name || ''} onChange={handleChange} required /></Form.Group>
                        {cardData.vehicle_type !== 'bicycle' && (<Form.Group className="mb-3"><Form.Label>Biển số</Form.Label><Form.Control type="text" name="license_plate" value={formData.license_plate || ''} onChange={handleChange} required /></Form.Group>)}
                        <Row>
                            <Col><Form.Group className="mb-3"><Form.Label>Nhãn hiệu</Form.Label><Form.Control type="text" name="brand" value={formData.brand || ''} onChange={handleChange} required /></Form.Group></Col>
                            <Col><Form.Group className="mb-3"><Form.Label>Màu xe</Form.Label><Form.Control type="text" name="color" value={formData.color || ''} onChange={handleChange} required /></Form.Group></Col>
                        </Row>
                        {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    </Form>
                ) : <div className="text-center"><Spinner animation="border" /></div>}
            </Modal.Body>
            <Modal.Footer>
                 <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                 <Button variant="primary" onClick={handleSaveChanges} disabled={loading}>{loading ? <Spinner as="span" size="sm" /> : 'Lưu thay đổi'}</Button>
             </Modal.Footer>
        </Modal>
    );
};
// --- (Kết thúc EditCardModal) ---

// Hàm helper đặt bên ngoài
const getRequestTypeText = (type) => ({ register: 'Đăng ký mới', reissue: 'Cấp lại', cancel: 'Hủy' }[type] || type);
// getVehicleTypeText đã được đưa lên trên


const VehicleManagement = () => {
    const [key, setKey] = useState('pending');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageUrlToShow, setImageUrlToShow] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [requestToReject, setRequestToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [cardToEditDetails, setCardToEditDetails] = useState(null);
    const [editLoading, setEditLoading] = useState(false);


    const getAuthConfig = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { setError("Authentication error: Admin token missing."); return null; }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    const fetchPendingRequests = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoadingRequests(true); setError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-requests?status=pending`, config);
            setPendingRequests(res.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed load pending.'); }
        finally { setLoadingRequests(false); }
    }, []); // <-- Đã bỏ getAuthConfig

    const fetchAllCards = useCallback(async () => {
        const config = getAuthConfig();
        if (!config) return;
        setLoadingCards(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-cards`, config);
            setAllCards(res.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed load cards.'); }
        finally { setLoadingCards(false); }
    }, []); // <-- Đã bỏ getAuthConfig

    useEffect(() => {
        fetchPendingRequests();
        fetchAllCards();
    }, [fetchPendingRequests, fetchAllCards]);

    const handleApprove = async (requestId) => {
         const config = getAuthConfig(); if (!config) return;
        setError(''); setSuccess('');
        if (!window.confirm(`Approve request #${requestId}?`)) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/vehicle-requests/${requestId}/approve`, {}, config);
            setSuccess(`Request #${requestId} approved.`);
            await fetchPendingRequests(); await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Approve failed.`);}
    };

    const openRejectModal = (request) => {
        setRequestToReject(request); setRejectReason(''); setShowRejectModal(true);
     };

    const handleReject = async () => {
         const config = getAuthConfig(); if (!config) return;
        if (!rejectReason.trim()) { alert("Please enter reason."); return; }
        setRejectLoading(true); setError(''); setSuccess('');
        try {
            if (!requestToReject || !requestToReject.id) { throw new Error("Invalid request data."); }
            const requestId = requestToReject.id;
            await axios.post(`${API_BASE_URL}/api/admin/vehicle-requests/${requestId}/reject`, { admin_notes: rejectReason }, config);
            setSuccess(`Request #${requestId} rejected.`); setShowRejectModal(false);
            await fetchPendingRequests();
        } catch (err) { setError(err.response?.data?.message || `Reject failed.`); setShowRejectModal(false);}
        finally { setRejectLoading(false); }
    };

    const handleShowImage = (url) => {
        const fullUrl = url && url.startsWith('/uploads') ? `${API_BASE_URL}${url}` : url;
        setImageUrlToShow(fullUrl || ''); setShowImageModal(true);
    };

    const handleCloseImageModal = () => setShowImageModal(false);
    const handleCloseRejectModal = () => setShowRejectModal(false);

    const handleOpenEditModal = async (cardId) => {
        setError(''); setSuccess(''); setEditLoading(true); setShowEditModal(true); setCardToEditDetails(null);
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Chưa đăng nhập admin.");
            const res = await axios.get(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}`, config);
            setCardToEditDetails(res.data);
        } catch (err) { setError(err.response?.data?.message || `Cannot load card #${cardId}.`); setShowEditModal(false); }
        finally { setEditLoading(false); }
    };
    const handleCloseEditModal = () => { setShowEditModal(false); setCardToEditDetails(null); };

    const handleSaveChanges = async (cardId, updatedData) => {
        setError(''); setSuccess(''); setEditLoading(true);
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Chưa đăng nhập admin.");
            await axios.put(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}`, updatedData, config);
            setSuccess(`Đã cập nhật thẻ #${cardId}.`); handleCloseEditModal();
            await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Update card #${cardId} failed.`); }
        finally { setEditLoading(false); }
    };

    const handleSetStatus = async (cardId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setError(''); setSuccess('');
        if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} thẻ #${cardId}?`)) return;
        try {
            const config = getAuthConfig(); if (!config) throw new Error("Chưa đăng nhập admin.");
            await axios.patch(`${API_BASE_URL}/api/admin/vehicle-cards/${cardId}/status`, { status: newStatus }, config);
            setSuccess(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} thẻ #${cardId}.`);
            await fetchAllCards();
        } catch (err) { setError(err.response?.data?.message || `Update status card #${cardId} failed.`); }
    };

    // --- JSX Render Chính ---
    return (
        <Container fluid className="p-3">
            <h3>Quản lý Thẻ xe</h3> <hr />
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Tabs id="vehicle-management-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                {/* --- Tab Pending Requests --- */}
                <Tab eventKey="pending" title={`Yêu cầu (${loadingRequests ? '...' : pendingRequests.length})`}>
                    {loadingRequests ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     pendingRequests.length === 0 ? <Alert variant="info">Không có yêu cầu chờ duyệt.</Alert> : (
                        <Table striped bordered hover responsive size="sm">
                           <thead><tr><th>ID</th><th>Resident</th><th>Loại Y/C</th><th>Type</th><th>User</th><th>License Plate</th><th>Brand</th><th>Ảnh/Lý do</th><th>Time</th><th>Actions</th></tr></thead>
                            <tbody>{pendingRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.id}</td><td>{req.resident_name || `ID:${req.resident_id}`}</td>
                                    <td>{getRequestTypeText(req.request_type)}</td>
                                    <td>{getVehicleTypeText(req.vehicle_type)}</td><td>{req.full_name}</td><td>{req.license_plate || 'N/A'}</td><td>{req.brand}</td>
                                    <td>
                                        {/* highlight-start */}
                                        {/* Đã xóa comment lỗi */}
                                        {req.proof_image_url ? (<Button variant="link" size="sm" onClick={() => handleShowImage(req.proof_image_url)}>Xem Ảnh</Button>)
                                         : req.reason ? (<span title={req.reason}>{req.reason.substring(0, 30)}{req.reason.length > 30 ? '...' : ''}</span>)
                                         : '-'}
                                        {/* highlight-end */}
                                    </td>
                                    <td>{new Date(req.requested_at).toLocaleString()}</td>
                                    <td>
                                        <Button variant="success" size="sm" className="me-1" onClick={() => handleApprove(req.id)} disabled={loadingRequests}>Duyệt</Button>
                                        <Button variant="danger" size="sm" onClick={() => openRejectModal(req)} disabled={loadingRequests}>Từ chối</Button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </Table>
                    )}
                </Tab>

                {/* --- Tab All Cards --- */}
                <Tab eventKey="all" title="Tất cả Thẻ">
                     {loadingCards ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     allCards.length === 0 ? <Alert variant="info">Chưa có thẻ xe nào.</Alert> : (
                        <Table striped bordered hover responsive size="sm">
                            <thead><tr><th>ID</th><th>Resident</th><th>User</th><th>Type</th><th>License Plate</th><th>Brand</th><th>Status</th><th>Issued At</th><th>Actions</th></tr></thead>
                            <tbody>{allCards.map(card => {
                                const isChangableStatus = card.status === 'active' || card.status === 'inactive';
                                return (
                                <tr key={card.id}>
                                    <td>{card.id}</td><td>{card.resident_name || `ID:${card.resident_id}`}</td><td>{card.card_user_name}</td><td>{getVehicleTypeText(card.vehicle_type)}</td><td>{card.license_plate || 'N/A'}</td><td>{card.brand}</td>
                                    <td><span className={`badge bg-${{active:'success', inactive:'warning', lost:'secondary', canceled:'danger'}[card.status] || 'secondary'}`}>{card.status}</span></td>
                                    <td>{new Date(card.issued_at).toLocaleDateString()}</td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleOpenEditModal(card.id)} title="Chỉnh sửa">
                                            <PencilFill />
                                        </Button>
                                        {isChangableStatus && (
                                            <Button
                                                variant={card.status === 'active' ? 'outline-warning' : 'outline-success'}
                                                size="sm"
                                                onClick={() => handleSetStatus(card.id, card.status)}
                                                title={card.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            >
                                                {card.status === 'active' ? <PauseCircleFill /> : <PlayCircleFill />}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                                )
                            })}</tbody>
                        </Table>
                    )}
                </Tab>
            </Tabs>

            {/* --- Modals --- */}
            <Modal show={showImageModal} onHide={handleCloseImageModal} centered size="lg">
                 <Modal.Header closeButton><Modal.Title>Ảnh Minh Chứng</Modal.Title></Modal.Header>
                 <Modal.Body className="text-center">
                    {imageUrlToShow ?
                        <Image src={imageUrlToShow} fluid onError={(e) => { e.target.onerror = null; e.target.alt="Ảnh bị lỗi hoặc không tồn tại"; e.target.src="/images/placeholder-error.png"}} />
                        : <p>Không có đường dẫn ảnh.</p>
                    }
                 </Modal.Body>
             </Modal>
            <Modal show={showRejectModal} onHide={handleCloseRejectModal}>
                 <Modal.Header closeButton><Modal.Title>Từ chối yêu cầu #{requestToReject?.id}</Modal.Title></Modal.Header>
                 <Modal.Body><Form.Group><Form.Label>Lý do từ chối:</Form.Label><Form.Control as="textarea" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required /></Form.Group></Modal.Body>
                 <Modal.Footer>
                     <Button variant="secondary" onClick={handleCloseRejectModal}>Hủy</Button>
                     <Button variant="danger" onClick={handleReject} disabled={rejectLoading}>{rejectLoading ? <Spinner size="sm"/> : 'Xác nhận Từ chối'}</Button>
                 </Modal.Footer>
             </Modal>
            <EditCardModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                cardData={cardToEditDetails}
                onSave={handleSaveChanges}
                loading={editLoading}
            />
        </Container>
    );
};

export default VehicleManagement;