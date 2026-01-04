import { createContext, useContext, useState } from "react";

const dummyNotifications = [
  { id: 1, type: "like", message: "John Doe liked your post", read: false },
  { id: 2, type: "comment", message: "Jane Smith commented", read: false },
  { id: 3, type: "follow", message: "Mike Johnson followed you", read: true },
  { id: 4, type: "connection", message: "Sarah Wilson accepted", read: true },
  { id: 5, type: "like", message: "Alex Brown liked your comment", read: false },
  { id: 6, type: "comment", message: "Emily Davis replied", read: true },
];

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
