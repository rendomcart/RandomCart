const StatusTimeline = ({ order }) => {
  const currentStatus = order?.orderStatus || 'Pending';
  const timeline = order?.timeline || [];
  const statuses = ['Pending', 'Approved', 'Processing', 'Shipped', 'Delivered'];
  
  let currentIndex = statuses.indexOf(currentStatus);
  if (currentIndex === -1) {
    if (currentStatus === 'Cancelled' || currentStatus === 'Returned') {
      // Don't show standard timeline for cancelled/returned
      return (
        <div className="py-4 text-center">
          <span className="inline-block px-4 py-2 bg-red-100 text-red-600 font-bold rounded-full">
            Order {currentStatus}
          </span>
        </div>
      );
    }
    currentIndex = 0; // Default to Processing if unknown
  }

  return (
    <div className="relative py-8">
      {/* Background line */}
      <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200 z-0"></div>
      
      {/* Active line */}
      <div 
        className="absolute top-12 left-0 h-1 bg-green-500 z-0 transition-all duration-500" 
        style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
      ></div>

      <div className="relative z-10 flex justify-between">
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          const event = timeline.find(t => t.status === status);
          
          return (
            <div key={status} className="flex flex-col items-center w-20">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 z-10 transition-colors ${
                  isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap ${isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                {status}
              </span>
              {event && (
                <span className="text-xs text-gray-400 mt-1 text-center leading-tight">
                  {new Date(event.date).toLocaleDateString()}<br/>
                  {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
