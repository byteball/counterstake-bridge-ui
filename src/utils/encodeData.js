export const encodeData = (data) => {
  const sData = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(sData)));
};
