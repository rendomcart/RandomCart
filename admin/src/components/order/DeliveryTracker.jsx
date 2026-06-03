import React from 'react';

const DeliveryTracker = ({ order }) => {
  if (!order) return null;

  const {
    orderStatus,
    deliveryType = 'Standard',
    deliveryCharge = 0,
    expectedDates = {},
    timeline = [],
    workflowFlags = {}
  } = order;

  // Determine current progress
  const flowStatuses = ['Pending Approval', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  
  // Handle edge cases
  if (['Cancelled', 'Returned', 'Rejected'].includes(orderStatus)) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <h3 className="text-red-700 font-bold text-lg mb-2">Order {orderStatus}</h3>
        <p className="text-red-600 text-sm">Delivery tracking is not available for this order.</p>
      </div>
    );
  }

  let currentIndex = flowStatuses.indexOf(orderStatus);
  if (currentIndex === -1) {
    if (orderStatus === 'Overdue Review') currentIndex = 0;
    else currentIndex = 1;
  }

  const progressPercentage = (currentIndex / (flowStatuses.length - 1)) * 100;

  // Calculate remaining days
  const now = new Date();
  let remainingText = '';
  
  if (orderStatus === 'Delivered' && expectedDates.delivered) {
    remainingText = `Delivered Successfully on: ${new Date(order.actualDeliveryDate || expectedDates.delivered).toLocaleDateString()}`;
  } else if (expectedDates.delivered) {
    const estDate = new Date(expectedDates.delivered);
    const diffTime = estDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      remainingText = `${diffDays} Day${diffDays > 1 ? 's' : ''} Remaining`;
    } else if (diffDays === 0) {
      remainingText = 'Expected Delivery Today';
    } else {
      remainingText = 'Delivery is running late';
    }
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Header Info */}
      <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Delivery Method</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{deliveryType} Delivery</span>
            <span className={`text-xs px-2 py-1 rounded font-bold ${deliveryCharge > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {deliveryCharge > 0 ? `₹${deliveryCharge}` : 'Free'}
            </span>
            {workflowFlags?.autoApproved && (
              <span className="text-xs px-2 py-1 rounded font-bold bg-purple-100 text-purple-800 ml-2">
                Auto-Approved
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Estimated Delivery</span>
          <div className="font-bold text-lg text-primary">
            {orderStatus === 'Delivered' ? (
              <span className="text-green-600">Delivered</span>
            ) : expectedDates.delivered ? (
              new Date(expectedDates.delivered).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            ) : (
              'Pending'
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-2">
          <span className="font-bold text-sm text-gray-700">Delivery Progress: {Math.round(progressPercentage)}%</span>
          <span className={`text-sm font-bold sm:text-right ${orderStatus === 'Delivered' ? 'text-green-600' : 'text-orange-500'}`}>
            {remainingText}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-8">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${orderStatus === 'Delivered' ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Timeline Steps */}
        <div className="relative">
          <div className="flex justify-between">
            {flowStatuses.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const event = timeline.find(t => t.status === status);
              
              let displayDate = null;
              let isActual = !!event;

              if (status === 'Pending Approval') {
                 displayDate = new Date(order.createdAt);
                 isActual = true;
              } else if (status === 'Processing') {
                 displayDate = event ? new Date(event.date) : (expectedDates.processing ? new Date(expectedDates.processing) : null);
              } else if (status === 'Shipped') {
                 displayDate = event ? new Date(event.date) : (expectedDates.shipped ? new Date(expectedDates.shipped) : null);
              } else if (status === 'Out for Delivery') {
                 displayDate = event ? new Date(event.date) : (expectedDates.outForDelivery ? new Date(expectedDates.outForDelivery) : null);
              } else if (status === 'Delivered') {
                 displayDate = event ? new Date(event.date) : (expectedDates.delivered ? new Date(expectedDates.delivered) : null);
              }

              return (
                <div key={status} className="flex flex-col items-center flex-1 relative z-10 px-1">
                  <div 
                    className={`w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-base rounded-full flex items-center justify-center font-bold mb-1 sm:mb-2 transition-colors border-2 ${
                      isCompleted 
                        ? (status === 'Delivered' ? 'bg-green-500 border-green-500 text-white' : 'bg-primary border-primary text-white')
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-[9px] sm:text-xs font-bold text-center leading-tight px-1 ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                    {status}
                  </span>
                  
                  {displayDate && (
                    <div className="mt-1 flex flex-col items-center text-center">
                      <span className={`text-[8px] sm:text-[10px] leading-tight ${isActual ? 'text-gray-600 font-medium' : 'text-gray-400 italic'}`}>
                        {displayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {!isActual && <span className="text-[9px] text-orange-400 uppercase tracking-wider">Est.</span>}
                    </div>
                  )}

                  {/* Badges for Auto or Admin Update */}
                  {event && event.updatedBy && status !== 'Pending Approval' && (
                    <div className="mt-1 text-center">
                      <span className={`text-[8px] px-1 py-0.5 rounded ${event.updatedBy === 'System' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        By {event.updatedBy}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracker;
