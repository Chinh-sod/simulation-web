// navigation.js
document.addEventListener('DOMContentLoaded', () => {
  // Các nút "Get Started" / "Bắt đầu Mô phỏng"
  document.querySelectorAll('.get-started-btn, button:contains("Get Started"), button:contains("Bắt đầu")')
    .forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'simulator.html';
      });
    });

  // Nút "Back to Simulator"
  document.querySelectorAll('.back-to-sim, button:contains("Back to Simulator")')
    .forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'simulator.html';
      });
    });
});