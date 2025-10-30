// frontend/src/pages/ServicePage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // <-- 1. THÊM useMemo
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ServicePage.css'; // Import CSS

const API_BASE_URL = 'http://localhost:5000'; // Define base URL

// Khai báo cấu trúc form ban đầu với đầy đủ key
const initialRegFormData = {
    fullName: '',
    dob: '',
    phone: '',
    relationship: '',
    licensePlate: '',
    brand: '',
    color: ''
};

const ServicePage = () => {
    const [key, setKey] = useState('register'); // State cho Tab
    const [existingCards, setExistingCards] = useState([]);
    // highlight-start
    // Sửa state theo logic mới của bạn (đã làm ở lần trước)
    const [historyCards, setHistoryCards] = useState([]); 
    // highlight-end
    const [loading, setLoading] = useState(true); // Chỉ dùng cho lần load đầu
    const [fetchError, setFetchError] = useState(''); // Lỗi khi fetch thẻ

    // === State cho Tab 1: Đăng ký mới ===
    const [regVehicleType, setRegVehicleType] = useState(null); // 'car', 'motorbike', 'bicycle'
    const [regFormData, setRegFormData] = useState(initialRegFormData); // Sử dụng initial state
    const [regFile, setRegFile] = useState(null);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    // === State cho Tab 2: Quản lý (Cấp lại / Hủy) ===
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState(''); // 'reissue' hoặc 'cancel'
    const [selectedCard, setSelectedCard] = useState(null);
    const [reason, setReason] = useState('');
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState('');
    const [manageSuccess, setManageSuccess] = useState('');

    // Hàm lấy Token User
     const getUserAuthConfig = useCallback(() => {
        const token = localStorage.getItem('token'); // Lấy token của user thường
         if (!token) {
             setFetchError("Vui lòng đăng nhập để sử dụng dịch vụ này.");
             return null;
        }
        return { headers: { 'Authorization': `Bearer ${token}` } };
    }, []);

    // --- 2. SỬA HÀM FETCH ĐỂ NHẬN 2 DANH SÁCH ---
    const fetchExistingCards = useCallback(async () => {
        const config = getUserAuthConfig();
        if (!config) { setLoading(false); return; } // Dừng nếu chưa login
        setLoading(true);
        setFetchError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/services/my-cards`, config);
            // Cập nhật cả 2 state từ data trả về
            setExistingCards(res.data.managedCards || []);
            setHistoryCards(res.data.historyCards || []);
        } catch (err) {
            console.error('Lỗi tải danh sách thẻ:', err);
            setFetchError(err.response?.data?.message || 'Không thể tải danh sách thẻ của bạn.');
        } finally {
            setLoading(false);
        }
    }, [getUserAuthConfig]);

    // Load thẻ khi component mount
    useEffect(() => {
        fetchExistingCards();
    }, [fetchExistingCards]);

    // --- 3. (MỚI) TÍNH TOÁN GIỚI HẠN XE ---
    const vehicleCounts = useMemo(() => {
        const counts = { car: 0, motorbike: 0 };
        // existingCards chứa cả thẻ (active/inactive) và yêu cầu (pending)
        existingCards.forEach(card => {
            const type = card.vehicle_type || card.type;
            if (type === 'car') {
                if (card.status === 'active' || card.status === 'inactive' || card.status === 'pending_register') {
                    counts.car++;
                }
            }
            if (type === 'motorbike') {
                 if (card.status === 'active' || card.status === 'inactive' || card.status === 'pending_register') {
                    counts.motorbike++;
                }
            }
        });
        return counts;
    }, [existingCards]);

    // Tạo biến boolean để dễ đọc code
    // highlight-start
    const canRegisterCar = vehicleCounts.car < 2; // <-- SỬA TỪ 1 THÀNH 2
    const canRegisterMotorbike = vehicleCounts.motorbike < 2; // <-- Giữ nguyên là 2
    // highlight-end


    // --- Logic Tab 1: Đăng ký ---
    const handleVehicleSelect = (type) => {
        setRegVehicleType(type);
        setRegFormData(initialRegFormData);
        setRegFile(null);
        setRegError('');
        setRegSuccess('');
    };

    const handleRegFormChange = (e) => {
        setRegFormData({ ...regFormData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setRegFile(e.target.files[0]);
    };

    // --- 4. SỬA LOGIC SUBMIT (THEO GIỚI HẠN MỚI) ---
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const config = getUserAuthConfig();
        if (!config) return;

        setRegLoading(true); setRegError(''); setRegSuccess('');

        // Kiểm tra logic nghiệp vụ (phía frontend)
        // highlight-start
        if (regVehicleType === 'car' && !canRegisterCar) { // Sửa kiểm tra
            setRegError('Bạn đã đạt giới hạn 2 thẻ ô tô.');
            setRegLoading(false); return;
        }
         if (regVehicleType === 'motorbike' && !canRegisterMotorbike) { // Sửa kiểm tra
            setRegError('Bạn đã đạt giới hạn 2 thẻ xe máy.');
            setRegLoading(false); return;
        }
        // highlight-end
        if (!regFile) {
            setRegError('Vui lòng tải lên ảnh minh chứng.');
             setRegLoading(false); return;
        }

        const formData = new FormData();
        formData.append('vehicleType', regVehicleType);
        Object.keys(regFormData).forEach(key => formData.append(key, regFormData[key]));
        if (regVehicleType === 'bicycle') formData.set('licensePlate', 'N/A');
        formData.append('proofImage', regFile);

        try {
            await axios.post(`${API_BASE_URL}/api/services/register-card`, formData, {
                ...config,
                headers: {
                    ...config.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setRegSuccess('Đã gửi yêu cầu đăng ký thành công! Vui lòng chờ BQL duyệt.');
            setRegVehicleType(null);
            fetchExistingCards(); // Tải lại thẻ
        } catch (err) {
            setRegError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
            console.error('Lỗi đăng ký thẻ:', err);
        } finally {
            setRegLoading(false);
        }
    };

     // Hàm helper lấy text loại xe
     const getVehicleTypeText = (type) => ({ car: 'Ô tô', motorbike: 'Xe máy', bicycle: 'Xe đạp' }[type] || type);

     // Hàm render form đăng ký (Giữ nguyên)
     const renderRegisterForm = () => {
        if (!regVehicleType) return null;
        const typeName = getVehicleTypeText(regVehicleType);
        return (
             <Container className="registration-form-container">
                 <h4 className="mb-3">Đăng ký thẻ cho {typeName}</h4>
                 <Form onSubmit={handleRegisterSubmit}>
                     {/* ... (Toàn bộ code Form JSX giữ nguyên) ... */}
                    <Row>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Họ và tên người dùng thẻ</Form.Label><Form.Control type="text" name="fullName" value={regFormData.fullName} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Ngày sinh</Form.Label><Form.Control type="date" name="dob" value={regFormData.dob} onChange={handleRegFormChange} required /></Form.Group></Col>
                         <Col md={4}><Form.Group className="mb-3"><Form.Label>Số điện thoại</Form.Label><Form.Control type="tel" name="phone" value={regFormData.phone} onChange={handleRegFormChange} required /></Form.Group></Col>
                     </Row>
                     <Row>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Mối quan hệ với chủ hộ</Form.Label><Form.Control type="text" name="relationship" value={regFormData.relationship} onChange={handleRegFormChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Nhãn hiệu</Form.Label><Form.Control type="text" name="brand" value={regFormData.brand} onChange={handleRegFormChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Màu xe</Form.Label><Form.Control type="text" name="color" value={regFormData.color} onChange={handleRegFormChange} required /></Form.Group></Col>
                    </Row>
                     <Row>
                        {regVehicleType !== 'bicycle' && (
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Biển số xe</Form.Label><Form.Control type="text" name="licensePlate" value={regFormData.licensePlate} onChange={handleRegFormChange} required /></Form.Group></Col>
                        )}
                        <Col md={regVehicleType !== 'bicycle' ? 6 : 12}><Form.Group className="mb-3"><Form.Label>Ảnh minh chứng (Giấy tờ xe/Biển số)</Form.Label><Form.Control type="file" name="proofImage" onChange={handleFileChange} accept="image/*" required /></Form.Group></Col>
                    </Row>
                    {regError && <Alert variant="danger">{regError}</Alert>}
                    {regSuccess && <Alert variant="success">{regSuccess}</Alert>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="secondary" onClick={() => setRegVehicleType(null)}>Quay lại</Button>
                        <Button variant="primary" type="submit" disabled={regLoading}>
                            {regLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi đăng ký'}
                        </Button>
                    </div>
                 </Form>
            </Container>
        );
      };

    // --- Logic Tab 2: Quản lý (Giữ nguyên) ---
    const openModal = (mode, card) => {
        setModalMode(mode); setSelectedCard(card); setReason(''); setManageError(''); setManageSuccess(''); setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false); setSelectedCard(null);
    };

    const handleManageSubmit = async () => {
        // ... (Code xử lý submit modal giữ nguyên) ...
        const config = getUserAuthConfig();
        if (!config) return;
        if (!reason.trim()) { setManageError('Vui lòng nhập lý do.'); return; }
        setManageLoading(true); setManageError(''); setManageSuccess('');
        try {
            const apiEndpoint = modalMode === 'reissue' ? 'reissue-card' : 'cancel-card';
            await axios.post(`${API_BASE_URL}/api/services/${apiEndpoint}`, { cardId: selectedCard.id, reason: reason }, config);
            const successMessage = modalMode === 'reissue' ? 'Yêu cầu cấp lại đã gửi!' : 'Yêu cầu hủy thẻ đã gửi!';
            setManageSuccess(successMessage + ' Vui lòng chờ BQL duyệt.');
            fetchExistingCards();
            closeModal();
        } catch (err) {
            setManageError(err.response?.data?.message || 'Gửi yêu cầu thất bại.');
            console.error(`Lỗi ${modalMode} thẻ:`, err);
        } finally {
            setManageLoading(false);
        }
    };

    // --- 5. CẬP NHẬT RENDER CARD ITEM (LOGIC MỚI TỪ LẦN TRƯỚC) ---
    const renderCardItem = (card) => {
        let iconClass = 'bi bi-patch-question';
        const type = card.type || card.vehicle_type;
        if (type === 'car') iconClass = 'bi bi-car-front-fill';
        if (type === 'motorbike') iconClass = 'bi bi-scooter';
        if (type === 'bicycle') iconClass = 'bi bi-bicycle';

        let statusText = card.status;
        let statusClass = 'text-secondary';
        let actions = null;

        switch (card.status) {
            case 'active':
                statusText = 'Đang hoạt động'; statusClass = 'text-success';
                actions = (<>
                    <Button variant="warning" size="sm" onClick={() => openModal('reissue', card)}>Cấp lại</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Hủy thẻ</Button>
                </>);
                break;
            case 'inactive': // <-- Logic 'Bị khoá'
                statusText = 'Bị khoá'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" onClick={() => openModal('reissue', card)}>Cấp lại</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Hủy thẻ</Button>
                </>);
                break;
            case 'pending_register':
                statusText = 'Chờ duyệt ĐK'; statusClass = 'text-warning';
                actions = <Button variant="secondary" size="sm" disabled>Đang xử lý</Button>;
                break;
            case 'pending_reissue':
                statusText = 'Chờ duyệt Cấp lại'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" disabled>Chờ duyệt Cấp lại</Button>
                    <Button variant="danger" size="sm" onClick={() => openModal('cancel', card)}>Hủy thẻ</Button>
                </>);
                break;
             case 'pending_cancel':
                statusText = 'Chờ duyệt Hủy'; statusClass = 'text-warning';
                actions = (<>
                    <Button variant="warning" size="sm" disabled>Chờ duyệt Hủy</Button>
                    <Button variant="danger" size="sm" disabled>Chờ duyệt Hủy</Button>
                </>);
                break;
             case 'lost': statusText = 'Đã báo mất'; statusClass = 'text-danger'; actions = null; break;
             case 'canceled': statusText = 'Đã hủy'; statusClass = 'text-danger'; actions = null; break;
            default: statusText = card.status;
        }

        return (
            <div className="existing-card-item" key={card.id}>
                <div className="existing-card-info">
                    <i className={iconClass}></i>
                    <div>
                        <h5>{card.brand} {card.model || ''}</h5>
                        <p>Biển số: <span>{card.license_plate || 'N/A'}</span></p>
                        <p>Trạng thái: <span className={statusClass}>{statusText}</span></p>
                    </div>
                </div>
                {actions && <div className="existing-card-actions">{actions}</div>}
            </div>
        );
    };

    // --- 6. CẬP NHẬT JSX (THÊM TAB MỚI VÀ LOGIC HIỂN THỊ GIỚI HẠN) ---
    return (
        <Container className="service-page my-4">
            <h2 className="mb-4">Dịch vụ Thẻ xe</h2>

            {fetchError && <Alert variant="danger">{fetchError}</Alert>}
            {manageSuccess && <Alert variant="success" onClose={() => setManageSuccess('')} dismissible>{manageSuccess}</Alert>}

            <Tabs id="service-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                {/* --- Tab 1: Đăng ký (Sửa ở đây) --- */}
                <Tab eventKey="register" title="Đăng ký thẻ mới">
                    {!regVehicleType ? (
                         <>
                            <h4 className="mb-3">Chọn loại phương tiện đăng ký:</h4>
                            <Row>
                                {/* --- LOGIC MỚI CHO Ô TÔ --- */}
                                {/* highlight-start */}
                                {canRegisterCar ? (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('car')}>
                                            <Card.Body>
                                                <i className="bi bi-car-front-fill"></i>
                                                <Card.Title className="mt-3">Ô tô</Card.Title>
                                                <Card.Text className="text-muted">(Còn {2 - vehicleCounts.car} suất)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ) : (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center text-muted bg-light" style={{ cursor: 'not-allowed' }}>
                                            <Card.Body>
                                                <i className="bi bi-car-front-fill text-muted"></i>
                                                <Card.Title className="mt-3">Ô tô</Card.Title>
                                                <Card.Text>(Đã đạt giới hạn 2 thẻ)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}
                                {/* highlight-end */}

                                {/* --- LOGIC MỚI CHO XE MÁY --- */}
                                {/* highlight-start */}
                                {canRegisterMotorbike ? (
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('motorbike')}>
                                            <Card.Body>
                                                <i className="bi bi-scooter"></i>
                                                <Card.Title className="mt-3">Xe máy</Card.Title>
                                                <Card.Text className="text-muted">(Còn {2 - vehicleCounts.motorbike} suất)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ) : (
                                     <Col md={4} className="mb-3">
                                        <Card className="text-center text-muted bg-light" style={{ cursor: 'not-allowed' }}>
                                            <Card.Body>
                                                <i className="bi bi-scooter text-muted"></i>
                                                <Card.Title className="mt-3">Xe máy</Card.Title>
                                                <Card.Text>(Đã đạt giới hạn 2 thẻ)</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                )}
                                {/* highlight-end */}

                                {/* Xe đạp (Không giới hạn) */}
                                <Col md={4} className="mb-3">
                                    <Card className="text-center vehicle-selection-card" onClick={() => handleVehicleSelect('bicycle')}>
                                        <Card.Body>
                                            <i className="bi bi-bicycle"></i>
                                            <Card.Title className="mt-3">Xe đạp</Card.Title>
                                            <Card.Text className="text-muted">(Không giới hạn)</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                         </>
                    ) : ( renderRegisterForm() )}
                </Tab>

                {/* --- Tab 2: Quản lý (Sử dụng 'existingCards') --- */}
                <Tab eventKey="manage" title="Quản lý thẻ hiện có">
                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     !fetchError && existingCards.length === 0 ? <p>Bạn chưa có thẻ xe nào hoặc yêu cầu nào đang chờ xử lý.</p> :
                     existingCards.map(card => renderCardItem(card))
                    }
                </Tab>

                {/* --- TAB 3: LỊCH SỬ THẺ (Sử dụng 'historyCards') --- */}
                <Tab eventKey="history" title="Lịch sử thẻ">
                    {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> :
                     !fetchError && historyCards.length === 0 ? <p>Không có thẻ nào trong lịch sử (đã hủy hoặc báo mất).</p> :
                     historyCards.map(card => renderCardItem(card))
                    }
                </Tab>
            </Tabs>

             {/* --- Modals (Giữ nguyên) --- */}
            <Modal show={showModal} onHide={closeModal}>
                 <Modal.Header closeButton><Modal.Title>{modalMode === 'reissue' ? 'Yêu cầu Cấp lại thẻ' : 'Yêu cầu Hủy thẻ'}</Modal.Title></Modal.Header>
                 <Modal.Body>
                     {selectedCard && <p>Thẻ xe: <strong>{selectedCard.brand} - {selectedCard.license_plate || 'N/A'}</strong></p>}
                     <Form.Group>
                         <Form.Label>Lý do:</Form.Label>
                         <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setManageError('');}} isInvalid={!!manageError} />
                         <Form.Control.Feedback type="invalid">{manageError}</Form.Control.Feedback>
                     </Form.Group>
                 </Modal.Body>
                 <Modal.Footer>
                     <Button variant="secondary" onClick={closeModal}>Đóng</Button>
                     <Button variant="primary" onClick={handleManageSubmit} disabled={manageLoading}>
                          {manageLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi yêu cầu'}
                     </Button>
                 </Modal.Footer>
             </Modal>
        </Container>
    );
};

export default ServicePage;