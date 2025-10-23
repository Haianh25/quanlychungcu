import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './News.css';

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/news');
        setNewsList(res.data);
      } catch (err) {
        console.error('Error fetching public news:', err);
        setError('Không thể tải tin tức. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div className="news-page container">Đang tải tin tức...</div>;
  if (error) return <div className="news-page container text-danger">{error}</div>;

  return (
    <div className="news-page container my-4">
      <h2>Tin tức</h2>
      {newsList.length === 0 ? (
        <p>Hiện chưa có tin tức nào.</p>
      ) : (
        <div className="row">
          {newsList.map(item => (
            <div className="col-md-6 mb-4" key={item.id}>
              <div className="card news-card h-100">
                {item.imageurl || item.image_url ? (
                  <img src={item.imageurl || item.image_url} className="card-img-top news-image" alt={item.title} />
                ) : (
                  <div className="news-image-placeholder">No image</div>
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.title}</h5>
                  <p className="card-text news-excerpt">{(item.content || '').slice(0, 200)}{(item.content || '').length > 200 ? '...' : ''}</p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <small className="text-muted">{new Date(item.created_at).toLocaleString()}</small>
                    <a className="btn btn-sm btn-primary" href={`/news/${item.id}`}>Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;
