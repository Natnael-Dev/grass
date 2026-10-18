/**
 * grass — main application entry point
 */

console.info(
  "%c  \\|/\n  \\|/\n~~~~~\nhey dev. you opened devtools on a grass website.\ngo touch some actual grass sometime. we'll be here.",
  'color: #a8d878; font-family: monospace; font-size: 12px; font-weight: bold;',
);

function init(): void {
  const enterBtn = document.getElementById('btn-enter') as HTMLButtonElement | null;
  const overlay = document.getElementById('entry-overlay');

  if (enterBtn && overlay) {
    enterBtn.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
