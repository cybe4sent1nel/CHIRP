const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;
