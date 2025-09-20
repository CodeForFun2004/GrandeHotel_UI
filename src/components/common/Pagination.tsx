import '../../styles/common/pagination.css';

interface PaginationProps{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({ currentPage , totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination">
      <button onClick={goToPrevious} disabled={currentPage === 1}>
        &laquo; Prev
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          className={number === currentPage ? 'active' : ''}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
      <button onClick={goToNext} disabled={currentPage === totalPages}>
        Next &raquo;
      </button>
    </div>
  );
}

export default Pagination;