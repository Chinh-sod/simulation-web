// js/simulator.js
document.addEventListener('DOMContentLoaded', () => {
    // ---------- DOM elements ----------
    const sliders = document.querySelectorAll('.param-slider');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const runBtn = document.getElementById('runSimulationBtn');
    
    // Các span hiển thị giá trị slider
    const valSpans = {
        INC: document.querySelector('.inc-val'),
        RAD: document.querySelector('.rad-val'),
        SPD: document.querySelector('.spd-val'),
        SEN: document.querySelector('.sen-val'),
        SEI: document.querySelector('.sei-val'),
        TRA: document.querySelector('.tra-val'),
        LEA: document.querySelector('.lea-val'),
        FIR: document.querySelector('.fir-val'),
        COP: document.querySelector('.cop-val'),
        RES: document.querySelector('.res-val')
    };
    
    // Radar elements
    const radarPolygon = document.getElementById('radarPolygon');
    const radarNodes = document.getElementById('radarNodes');
    const radarAxes = document.getElementById('radarAxes');
    
    // Chỉ số mới
    const efficiencyScoreEl = document.getElementById('efficiencyScore');
    const efficiencyBar = document.getElementById('efficiencyBar');
    const riskScoreEl = document.getElementById('riskScore');
    const riskBar = document.getElementById('riskBar');
    const loadValueEl = document.getElementById('loadValue');
    const loadBarsContainer = document.getElementById('loadBarsContainer');
    
    // Insights
    const insight1 = document.getElementById('insight1');
    const insight2 = document.getElementById('insight2');
    const insight3 = document.getElementById('insight3');
    
    // ---------- Dữ liệu mẫu preset (giữ nguyên giá trị gốc) ----------
    const presets = {
        'Song hành ': { INC:76, RAD:45, SPD:75, SEN:80, SEI:75, TRA:72, LEA:70, FIR:65, COP:75, RES:62 },
        'Tuần tự ':   { INC:75, RAD:25, SPD:60, SEN:50, SEI:45, TRA:55, LEA:65, FIR:35, COP:55, RES:70 },
        'Dẫn đầu ':  { INC:30, RAD:80, SPD:95, SEN:90, SEI:85, TRA:88, LEA:90, FIR:95, COP:75, RES:60 },
        'Theo sau ':{ INC:65, RAD:35, SPD:85, SEN:80, SEI:88, TRA:75, LEA:82, FIR:30, COP:80, RES:65 },
        'Bắt chước':     { INC:90, RAD:10, SPD:70, SEN:55, SEI:60, TRA:50, LEA:70, FIR:15, COP:85, RES:80 }
    };
    
    // ---------- Hàm lấy toàn bộ tham số hiện tại ----------
    function getCurrentParams() {
        const params = {};
        sliders.forEach(s => {
            const param = s.dataset.param;
            params[param] = parseFloat(s.value);
        });
        return params;
    }
    
    // ---------- Cập nhật UI slider và các thành phần liên quan ----------
    function updateUI() {
        const p = getCurrentParams();
        // Cập nhật span giá trị
        for (let key in valSpans) {
            if (valSpans[key]) valSpans[key].textContent = p[key] + '%';
        }
        // Radar
        drawRadar(p);
        // Chỉ số hiệu quả, rủi ro, tải trọng
        updateMetrics(p);
        // Insights
        updateInsights(p);
        // Load bars
        renderLoadBars(p);
    }
    
    // ---------- Vẽ radar 10 đỉnh ----------
    function drawRadar(params) {
        const keys = ['INC','RAD','SPD','SEN','SEI','TRA','LEA','FIR','COP','RES'];
        const center = 50, maxR = 45;
        const points = [];
        
        // Vẽ trục (chỉ vẽ lần đầu)
        if (radarAxes.children.length === 0) {
            radarAxes.innerHTML = '';
            keys.forEach((_, i) => {
                const angle = (i * 2 * Math.PI / keys.length) - Math.PI/2;
                const x2 = center + maxR * Math.cos(angle);
                const y2 = center + maxR * Math.sin(angle);
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", center);
                line.setAttribute("y1", center);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
                line.setAttribute("stroke", "#c4c6d1");
                line.setAttribute("stroke-width", "0.5");
                line.setAttribute("stroke-dasharray", "2 2");
                radarAxes.appendChild(line);
            });
        }
        
        // Xóa nodes cũ
        radarNodes.innerHTML = '';
        
        keys.forEach((key, i) => {
            const val = params[key] || 0;
            const angle = (i * 2 * Math.PI / keys.length) - Math.PI/2;
            const r = (val / 100) * maxR;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            points.push(`${x},${y}`);
            
            // Node
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", "2.5");
            circle.setAttribute("fill", "#006d33");
            circle.setAttribute("class", "radar-node");
            radarNodes.appendChild(circle);
            
            // Label nhỏ
            const labelX = center + (maxR + 8) * Math.cos(angle);
            const labelY = center + (maxR + 8) * Math.sin(angle);
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", labelX);
            text.setAttribute("y", labelY);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("class", "text-[7px] font-bold fill-on-surface-variant");
            text.textContent = key;
            radarNodes.appendChild(text);
        });
        
        radarPolygon.setAttribute("points", points.join(" "));
    }
    
    // ---------- Tính toán chỉ số ----------
    function updateMetrics(p) {
        // Công thức tham khảo từ đề xuất backend
        const inc = p.INC, rad = p.RAD, spd = p.SPD, sen = p.SEN, sei = p.SEI, tra = p.TRA, lea = p.LEA, cop = p.COP;
        
        // Hiệu quả (dựa trên growth tiềm năng)
        let eff = (inc * 0.35 + rad * 0.65) * 1.1 + (spd * 0.15) + (lea * 0.1);
        eff = Math.min(100, Math.round(eff));
        
        // Rủi ro (theo công thức file)
        let risk = (25 * (inc/100) + 55 * (rad/100) - 15 * (spd/100) - 12 * (cop/100) - 8 * (sen/100) - 10 * (sei/100) - 12 * (tra/100) - 6 * (lea/100));
        risk = Math.max(5, Math.min(95, Math.round(risk)));
        
        efficiencyScoreEl.textContent = eff + '%';
        efficiencyBar.style.width = eff + '%';
        riskScoreEl.textContent = risk + '%';
        riskBar.style.width = risk + '%';
        
        // Tải trọng giả lập dựa trên SPD và RES
        const loadVal = (spd * 0.08 + p.RES * 0.05).toFixed(1);
        loadValueEl.textContent = loadVal + ' TB/s';
    }
    
    function renderLoadBars(p) {
        // Tăng số cột lên 36 để biểu đồ dài hơn, chiều cao lớn hơn
        const spd = p.SPD, res = p.RES;
        const base = (spd + res) / 2;
        let html = '';
        for (let i=0; i<36; i++) {
            const height = Math.min(95, Math.max(15, base * 0.7 + Math.random() * 30));
            html += `<div class="flex-1 bg-primary/30 hover:bg-primary/60 transition-all rounded-t-sm load-bar" style="height:${height}%"></div>`;
        }
        loadBarsContainer.innerHTML = html;
    }
    
    function updateInsights(p) {
        const inc = p.INC, rad = p.RAD, cop = p.COP, sen = p.SEN, tra = p.TRA;
        let i1 = '', i2 = '', i3 = '';
        if (rad > 60) i1 = 'Radical cao: tiềm năng đột phá nhưng cần thời gian.';
        else if (inc > 70) i1 = 'Incremental mạnh: ổn định, ít rủi ro.';
        else i1 = 'Cân bằng INC/RAD tốt, tiềm năng tăng trưởng ổn định.';
        
        if (sen > 70) i2 = 'Năng lực Sensing mạnh giúp giảm rủi ro dài hạn.';
        else i2 = 'Cần cải thiện Sensing để nắm bắt cơ hội sớm.';
        
        if (cop < 40) i3 = 'Hợp tác (COP) thấp có thể gây cô lập hệ sinh thái.';
        else if (tra < 50) i3 = 'Transforming yếu, khó chuyển đổi mô hình.';
        else i3 = 'Hệ sinh thái hợp tác và chuyển đổi tốt.';
        
        insight1.textContent = i1;
        insight2.textContent = i2;
        insight3.textContent = i3;
    }
    
    // ---------- Xử lý slider ----------
    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            const param = slider.dataset.param;
            const span = valSpans[param];
            if (span) span.textContent = slider.value + '%';
            updateUI();
        });
    });
    
    // ---------- Preset buttons (highlight border, không fill nền) ----------
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Xóa active tất cả
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const presetName = btn.dataset.preset;
            const values = presets[presetName];
            if (!values) return;
            
            // Gán giá trị slider
            sliders.forEach(s => {
                const param = s.dataset.param;
                if (values[param] !== undefined) {
                    s.value = values[param];
                    const span = valSpans[param];
                    if (span) span.textContent = values[param] + '%';
                }
            });
            updateUI();
        });
    });
    
    // ---------- Nút chạy mô phỏng (giữ nguyên hành vi gọi backend) ----------
    if (runBtn) {
        runBtn.addEventListener('click', async () => {
            const params = getCurrentParams();
            sessionStorage.setItem('simParams', JSON.stringify(params));
            try {
                const response = await fetch('/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params)
                });
                const result = await response.json();
                sessionStorage.setItem('simResult', JSON.stringify(result));
                window.location.href = 'results.html';
            } catch (error) {
                alert('Không thể kết nối đến backend. Hãy đảm bảo server Flask đang chạy tại http://localhost:5000');
                console.error(error);
            }
        });
    }
    
    // Khởi tạo UI lần đầu
    (function init() {
        // Mặc định active preset Song hành 
        const defaultBtn = document.querySelector('[data-preset="Song hành "]');
        if (defaultBtn) {
            presetButtons.forEach(b => b.classList.remove('active'));
            defaultBtn.classList.add('active');
        }
        updateUI();
        // Vẽ trục radar
        drawRadar(getCurrentParams());
    })();
});