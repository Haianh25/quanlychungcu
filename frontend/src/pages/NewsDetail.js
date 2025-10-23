import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './News.css';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/news/${id}`);
        setItem(res.data);
      } catch (err) {
        console.error('Error fetching news detail:', err);
        setError('Không thể tải nội dung.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <div className="news-page container">Đang tải...</div>;
  if (error) return <div className="news-page container text-danger">{error}</div>;
  if (!item) return <div className="news-page container">Không tìm thấy bài viết.</div>;

  return (
    <div className="news-page container my-4">
      <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>&larr; Quay lại</button>
      <h2>{item.title}</h2>
      <div className="text-muted mb-2">{new Date(item.created_at).toLocaleString()} • {item.author_name || 'Ban quản trị'}</div>
      {item.image_url && <img src={item.image_url} alt={item.title} className="img-fluid mb-3" />}
      <div className="news-content" dangerouslySetInnerHTML={{ __html: item.content }} />
    </div>
  );
};

export default NewsDetail;
