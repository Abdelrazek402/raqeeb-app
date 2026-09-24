const SEARCH_HOSTS = new Set(['www.google.com', 'www.google.co.uk', 'www.bing.com', 'www.youtube.com']);

chrome.runtime.onInstalled.addListener(() => chrome.storage.local.set({ protectionEnabled: true }));

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== 'loading') return;
  const { protectionEnabled = true } = await chrome.storage.local.get('protectionEnabled');
  if (!protectionEnabled || !tab.url) return;
  const url = new URL(tab.url);
  if (!SEARCH_HOSTS.has(url.hostname)) return;
  if (url.hostname.includes('google.') && url.searchParams.get('safe') !== 'active') {
    url.searchParams.set('safe', 'active');
  } else if (url.hostname === 'www.bing.com' && url.searchParams.get('adlt') !== 'strict') {
    url.searchParams.set('adlt', 'strict');
  } else if (url.hostname === 'www.youtube.com' && url.searchParams.has('search_query') && !url.searchParams.has('safeSearch')) {
    url.searchParams.set('safeSearch', 'strict');
  } else {
    return;
  }
  await chrome.tabs.update(tabId, { url: url.toString() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'setProtection') return;
  chrome.storage.local.set({ protectionEnabled: Boolean(message.enabled) }).then(() => sendResponse({ ok: true }));
  return true;
});
