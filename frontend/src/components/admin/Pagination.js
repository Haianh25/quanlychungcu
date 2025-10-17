// frontend/src/components/admin/Pagination.js
import React from 'react';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
    const pageNumbers = [];

    // Tính toán tổng số trang cần có
    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <nav>
            <ul className="pagination justify-content-center">
                {pageNumbers.map(number => (
                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); paginate(number); }}
                            className="page-link btn btn-link"
                            aria-current={currentPage === number ? 'page' : undefined}
                        >
                            {number}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Pagination;