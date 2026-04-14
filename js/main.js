// js/main.js - Siêu đơn giản để debug
console.log("=== MAIN.JS ĐÃ LOAD THÀNH CÔNG ===");

document.addEventListener("DOMContentLoaded", function() {
    console.log("Trang đã load xong - Navigation đang chạy");

    // Làm cho tất cả link Simulator, Theory... hoạt động
    document.querySelectorAll("a").forEach(function(a) {
        const txt = a.textContent.trim();
        if (txt.includes("Simulator")) a.href = "simulator.html";
        if (txt.includes("Theory")) a.href = "theory.html";
        if (txt.includes("Canvas")) a.href = "canvas.html";
        if (txt.includes("About")) a.href = "about.html";
        if (txt.includes("Contact")) a.href = "contact.html";
        if (txt.includes("Home")) a.href = "index.html";
    });

    // Làm cho nút "Back to Simulator" và "Bắt đầu Mô phỏng" hoạt động
    document.querySelectorAll("button").forEach(function(btn) {
        const txt = btn.textContent.trim();
        if (txt.includes("Back to Simulator") || txt.includes("Quay lại Simulator") || txt.includes("Bắt đầu Mô phỏng")) {
            btn.onclick = function() {
                window.location.href = "simulator.html";
            };
        }
    });

    console.log("=== NAVIGATION ĐÃ SẴN SÀNG ===");
});