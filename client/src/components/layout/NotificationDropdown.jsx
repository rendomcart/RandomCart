import { useContext, useRef, useEffect } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';

const NotificationDropdown = ({ isOpen, onClose, isMobile = false }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications
  } = useContext(NotificationContext);
  
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!document.contains(event.target)) return;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest('.notification-btn')
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const containerClasses = isMobile
    ? "w-full bg-white rounded border border-gray-200 flex flex-col max-h-[60vh] overflow-hidden mt-2"
    : "absolute top-12 right-0 w-80 sm:w-96 bg-white rounded shadow-xl border border-gray-200 z-50 flex flex-col max-h-[80vh] overflow-hidden";

  return (
    <div 
      ref={dropdownRef}
      className={containerClasses}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 border-b bg-gray-50 gap-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          <Bell size={16} className="text-primary" />
          Notifications
        </h3>
        {notifications.length > 0 && (
          <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
            <button 
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} 
              className="text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Check size={14} /> Read All
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }} 
              className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-grow bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle2 size={40} className="text-gray-300 mb-3" />
            <p>You have no notifications right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li 
                key={notif._id} 
                onClick={() => { if (!notif.isRead) markAsRead(notif._id); }}
                className={`p-4 hover:bg-gray-50 transition-colors relative group cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="pl-2 pr-2 sm:pr-4">
                  <div className="mb-2">
                    <h4 className={`text-[15px] ${!notif.isRead ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 block mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                    {notif.message}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex gap-3 mt-1">
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                      className="text-[11px] text-gray-400 hover:text-red-500 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t bg-gray-50 text-center">
          <p className="text-[11px] text-gray-400">Showing latest {notifications.length} notifications</p>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
