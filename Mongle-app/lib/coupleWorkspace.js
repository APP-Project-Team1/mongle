export const buildOwnerFilter = (userId) =>
  userId ? `owner_user_id.is.null,owner_user_id.eq.${userId}` : 'owner_user_id.is.null';

export const isOwnedByUser = (row, userId) => Boolean(userId && row?.owner_user_id === userId);

export const getOwnerBadgeLabel = (row, userId) =>
  isOwnedByUser(row, userId) ? '내 항목' : '공용';

export const toDbDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return null;
};

export const formatKoreanDate = (value) => {
  if (!value) return '-';
  const date = toDbDate(value);
  if (!date) return value;
  const [year, month, day] = date.split('-');
  return `${year}.${month}.${day}`;
};

export const formatWon = (amount = 0) => `${Number(amount || 0).toLocaleString()}원`;
