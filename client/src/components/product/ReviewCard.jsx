
const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${urlStr}`;
};
const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white p-4 rounded border mb-4 shadow-sm">
      <div className="flex-shrink-0 mt-1">
        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-500">
          {review.user?.avatar?.url ? (
            <img src={formatImgUrl(review.user.avatar.url)} alt={review.user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-yellow-500 text-sm">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </div>
            {review.title && <h4 className="font-bold text-gray-800 text-sm">{review.title}</h4>}
          </div>
          <p className="text-xs text-gray-500 mb-2">Reviewed on {new Date(review.createdAt).toLocaleDateString()}</p>
          <p className="text-gray-700 text-sm whitespace-pre-line mb-3">{review.comment}</p>
          
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {review.images.map((img, idx) => (
                <div key={idx} className="w-16 h-16 rounded overflow-hidden border">
                  <img src={formatImgUrl(img.url)} alt={`Review from ${review.user?.name}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
