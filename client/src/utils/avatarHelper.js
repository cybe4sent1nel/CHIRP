/**
 * Utility function to get user avatar consistently across the app
 * Supports Clerk users, custom auth users, and fallback to DiceBear
 */
export const getAvatarUrl = (user, clerkUser = null) => {
  // Priority 1: Custom user profile picture
  if (user?.profile_picture) {
    return user.profile_picture;
  }

  // Priority 2: Clerk user image
  if (clerkUser?.imageUrl) {
    return clerkUser.imageUrl;
  }

  // Priority 3: DiceBear fallback based on email/username
  const seed = user?.email || user?.username || clerkUser?.username || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&scale=80`;
};
