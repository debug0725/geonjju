// 라이트/다크 모드 — 화면이 그려지기 전에 먼저 실행돼 깜빡임을 막아요.
// 저장값: 'system'(기기 설정 따라감) | 'dark' | 'light'
(() => {
  const KEY = 'our-room-theme';
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const root = document.documentElement;

  function apply() {
    let pref = 'system';
    try { pref = localStorage.getItem(KEY) || 'system'; } catch {}
    const theme = pref === 'system' ? (media.matches ? 'light' : 'dark') : pref;
    root.dataset.theme = theme;
    root.dataset.themePref = pref;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#e3e5e8' : '#1e1f22';
  }

  apply();
  media.addEventListener?.('change', apply);

  window.setTheme = pref => {
    try { localStorage.setItem(KEY, pref); } catch {}
    root.classList.add('theme-anim');
    apply();
    setTimeout(() => root.classList.remove('theme-anim'), 300);
    window.dispatchEvent(new Event('themechange'));
  };
})();
