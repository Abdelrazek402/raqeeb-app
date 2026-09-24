(function () {
  if (location.hostname === 'localhost' || location.hostname.includes('raqeeb')) return;
  let minutes = 0;
  window.setInterval(() => {
    minutes += 1;
    if (minutes % 10 !== 0 || document.getElementById('raqeeb-reminder')) return;
    const banner = document.createElement('aside');
    banner.id = 'raqeeb-reminder';
    banner.dir = 'rtl';
    banner.textContent = 'تذكير رَقِيب: خذ نفسًا، وجدّد نيتك، وواصل ما ينفعك.';
    Object.assign(banner.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
      padding: '12px 16px', maxWidth: '280px', borderRadius: '12px',
      background: '#0f766e', color: '#fff', font: '14px system-ui', boxShadow: '0 8px 24px #0004'
    });
    banner.addEventListener('click', () => banner.remove());
    document.documentElement.appendChild(banner);
    window.setTimeout(() => banner.remove(), 8000);
  }, 60000);
}());
