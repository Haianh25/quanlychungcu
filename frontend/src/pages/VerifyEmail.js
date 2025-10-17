// frontend/src/pages/VerifyEmail.js
import React, { useState, useEffect, useRef } from 'react'; // Import thêm useRef
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');
    const [error, setError] = useState('');
    const { token } = useParams();

    // Dùng useRef để tạo một "cờ" đánh dấu.
    // Giá trị của ref sẽ không bị reset giữa các lần useEffect chạy.
    const effectRan = useRef(false);

    useEffect(() => {
        // Chỉ thực hiện logic nếu "cờ" chưa được bật
        if (effectRan.current === false) {
            const verifyToken = async () => {
                if (!token) {
                    setError('Không tìm thấy token xác thực.');
                    return;
                }
                try {
                    const res = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
                    setMessage(res.data.message);
                    setError('');
                } catch (err) {
                    setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
                    setMessage('');
                }
            };

            verifyToken();

            // Sau khi chạy lần đầu, bật "cờ" lên
            return () => {
                effectRan.current = true;
            };
        }
    }, [token]); // Mảng phụ thuộc không đổi

    return (
        <div className="text-center">
            <h1>Trạng Thái Kích Hoạt Tài Khoản</h1>
            {message && <p className="alert alert-success">{message}</p>}
            {error && <p className="alert alert-danger">{error}</p>}
            {(message || error) && (
                <Link to="/login" className="btn btn-primary">
                    Đi đến trang Đăng nhập
                </Link>
            )}
        </div>
    );
};

export default VerifyEmail;