export const getThreadId = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('threadId');
};

export const getProxyToken = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('proxyToken');
};
