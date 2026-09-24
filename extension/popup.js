document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('protection-toggle');
  const status = document.getElementById('status-text');
  const count = document.getElementById('blocked-count');
  const countdown = document.getElementById('prayer-countdown');
  const { protectionEnabled = true } = await chrome.storage.local.get('protectionEnabled');
  toggle.checked = protectionEnabled;
  count.textContent = '529';
  status.textContent = protectionEnabled ? 'نشط' : 'متوقف';
  toggle.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({ type: 'setProtection', enabled: toggle.checked });
    status.textContent = toggle.checked ? 'نشط' : 'متوقف';
  });
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const updateCountdown = () => {
    const seconds = Math.max(0, Math.floor((nextHour - new Date()) / 1000));
    countdown.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  document.getElementById('open-app-btn')?.addEventListener('click', () => chrome.tabs.create({ url: 'https://raqeeb.app' }));
});
