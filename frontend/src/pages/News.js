import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Pagination from '../components/admin/Pagination'; // <-- SỬA ĐÚNG
import './News.css';

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6; // Giới hạn 6 bài/trang (Sẽ dùng cho prop 'itemsPerPage')

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

  const createExcerpt = (htmlContent, maxLength) => {
    if (!htmlContent) return '';
    const plainText = htmlContent.replace(/<[^>]+>/g, '');
    if (plainText.length <= maxLength) {
      return plainText;
    }
    return plainText.slice(0, maxLength) + '...';
  };

  const sortedNewsList = useMemo(() => {
    return [...newsList].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      if (sortOrder === 'desc') {
        return dateB - dateA; 
      } else {
        return dateA - dateB; 
      }
    });
  }, [newsList, sortOrder]);

  // Lấy ra danh sách bài viết cho trang hiện tại
  const currentNewsList = useMemo(() => {
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    return sortedNewsList.slice(indexOfFirstPost, indexOfLastPost);
  }, [sortedNewsList, currentPage, postsPerPage]);

  // Hàm xử lý khi đổi trang (sẽ truyền vào prop 'paginate')
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); 
  };

  // Tính tổng số trang (vẫn cần để ẩn/hiện pagination)
  const totalPages = Math.ceil(sortedNewsList.length / postsPerPage);

  if (loading) return <div className="news-page container">Đang tải tin tức...</div>;
  if (error) return <div className="news-page container text-danger">{error}</div>;

  return (
    <div className="news-page container my-4">
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Tin tức</h2>
        
        <div className="col-md-3">
          <select 
            id="sortOrder" 
            className="form-select" 
            value={sortOrder} 
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1); 
            }}
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
        </div>
      </div>
      
      {currentNewsList.length === 0 && !loading ? (
        <p>Hiện chưa có tin tức nào.</p>
      ) : (
        <div className="row">
          {currentNewsList.map(item => (
            <div className="col-md-6 mb-4" key={item.id}>
              <div className="card news-card h-100">
                {item.imageurl || item.image_url ? (
                  <img src={item.imageurl || item.image_url} className="card-img-top news-image" alt={item.title} />
                ) : (
                  <div className="news-image-placeholder">No image</div>
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.title}</h5>
                  <p className="card-text news-excerpt">
                    {createExcerpt(item.content, 200)}
                  </p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <small className="text-muted">{new Date(item.created_at).toLocaleString()}</small>
                    <Link className="btn btn-sm btn-primary" to={`/news/${item.id}`}>
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SỬA ĐỔI CHÍNH Ở ĐÂY --- */}
      {/* Truyền đúng props mà Pagination.js yêu cầu */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            itemsPerPage={postsPerPage} 
            totalItems={sortedNewsList.length} 
            paginate={handlePageChange} 
            currentPage={currentPage} 
          />
        </div>
      )}

    </div>
  );
};

export default News;