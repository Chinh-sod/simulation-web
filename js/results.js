// js/results.js
document.addEventListener('DOMContentLoaded', () => {
  const storedParams = JSON.parse(sessionStorage.getItem('simParams'));
  if (!storedParams) {
    document.body.innerHTML = '<div class="p-10 text-center"><h2 class="text-2xl font-bold text-error">Không có dữ liệu mô phỏng.</h2><p class="mt-4">Vui lòng chạy Simulator trước.</p><button class="mt-6 bg-primary text-white px-6 py-2 rounded-lg" onclick="window.location.href=\'simulator.html\'">Quay lại Simulator</button></div>';
    return;
  }

  // ---------- Hàm tính toán mô phỏng (client-side) ----------
  function runSimulation(params) {
    const baseRevenue = 5;
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    const results = [];
    let currentRevenue = baseRevenue;
    const multDyn = (1 + 0.12 * (params.SEN/100)) *
                    (1 + 0.15 * (params.SEI/100)) *
                    (1 + 0.18 * (params.TRA/100)) *
                    (1 + 0.10 * (params.LEA/100)) *
                    (1 + 0.08 * (params.FIR/100));
    let risk = (35 * (params.INC/100) + 65 * (params.RAD/100)
                - 12 * (params.SPD/100) - 10 * (params.COP/100)
                -  8 * (params.SEN/100) -  8 * (params.SEI/100)
                -  8 * (params.TRA/100) -  4 * (params.LEA/100));
    risk = Math.max(0, Math.min(100, risk));
    const growthRates = [];
    const revenues = [baseRevenue];
    // learningRate: chiến lược RAD cao tích lũy tri thức nhanh hơn
    const learningRate = 0.02 + 0.025 * (params.RAD / 100);
    // saturationRate: chiến lược INC cao + RAD thấp bão hòa sớm hơn
    const saturationRate = 0.005 + 0.025 * (params.INC / 100) * (1 - params.RAD / 100);
    for (let t = 0; t < years.length - 1; t++) {
      const radEfficiency = Math.min(1.0, 0.4 + t * 0.15);
      const learningFactor = 1 + learningRate * t;
      const marketSaturation = Math.max(0.5, 1 - saturationRate * t * t);
      let baseGrowth = 0.065 * (params.INC/100) 
                     + 0.105 * (params.RAD/100 * radEfficiency)
                     + 0.025 * (params.SPD/100)
                     + 0.015 * (params.COP/100);
      let growth = baseGrowth * multDyn * learningFactor * marketSaturation;
      const totalInv = params.INC + params.RAD;
      if (totalInv > 110) growth *= (1 - 0.005 * (totalInv - 110));
      growthRates.push(growth * 100);
      currentRevenue = currentRevenue * (1 + growth);
      revenues.push(currentRevenue);
    }
    const cagr = (Math.pow(currentRevenue / baseRevenue, 1/5) - 1) * 100;
    const radar = {
      Sensing: Math.min(100, 55 + 0.25*params.SEN + 0.15*params.LEA + 0.10*params.COP + 0.08*params.FIR),
      Seizing: Math.min(100, 50 + 0.30*params.SEI + 0.20*params.SPD + 0.15*params.RAD + 0.12*params.COP),
      Transforming: Math.min(100, 48 + 0.35*params.TRA + 0.18*params.INC + 0.15*params.SPD + 0.10*params.LEA)
    };
    return {
      yearly: revenues.map((rev, idx) => ({ year: years[idx], revenue: rev, growth: idx===0 ? 0 : growthRates[idx-1] })),
      finalRevenue: currentRevenue,
      risk: risk,
      cagr: cagr,
      radar: radar,
      growthRates: growthRates
    };
  }

  const simResult = runSimulation(storedParams);
  const params = storedParams;
  const finalRevenue = simResult.finalRevenue;
  const risk = simResult.risk;
  const growthAvg = simResult.cagr;
  const radar = simResult.radar;
  
  // Aggregate Score
  const growthScore = Math.min(100, Math.max(0, growthAvg * 4));
  const riskScorePart = 100 - risk;
  const aggScore = Math.round((growthScore * 0.5 + riskScorePart * 0.5));
  
  document.getElementById('forecastRevenue').textContent = `$${finalRevenue.toFixed(1)}B`;
  document.getElementById('riskScore').textContent = risk.toFixed(1);
  document.getElementById('growthCagr').textContent = growthAvg.toFixed(1) + '%';
  document.getElementById('growthBar').style.width = Math.min(100, growthAvg * 8) + '%';
  document.getElementById('aggregateScore').innerHTML = `${aggScore}<span class="text-lg opacity-50">/100</span>`;
  
  const starsContainer = document.getElementById('scoreStars');
  starsContainer.innerHTML = '';
  for (let i=0; i<5; i++) {
    const star = document.createElement('span');
    star.className = 'material-symbols-outlined ' + (i < Math.round(aggScore/20) ? 'text-secondary-fixed' : 'text-secondary-fixed/30');
    star.style.fontVariationSettings = "'FILL' 1";
    star.textContent = 'star';
    starsContainer.appendChild(star);
  }

  // ---------- 1. Phân loại rủi ro ----------
  const riskLabel = document.getElementById('riskLabel');
  const riskDesc = document.getElementById('riskDescription');
  let riskLevel = '';
  if (risk < 10) {
    riskLevel = 'Thấp';
    riskLabel.textContent = 'Cảnh Báo Thấp';
    riskLabel.className = 'text-xs font-bold uppercase tracking-widest text-green-600';
    riskDesc.textContent = 'Rủi ro thấp, môi trường kinh doanh ổn định.';
  } else if (risk <= 25) {
    riskLevel = 'Trung bình';
    riskLabel.textContent = 'Cảnh Báo Trung Bình';
    riskLabel.className = 'text-xs font-bold uppercase tracking-widest text-yellow-600';
    riskDesc.textContent = 'Rủi ro ở mức trung bình, cần theo dõi sát sao.';
  } else {
    riskLevel = 'Cao';
    riskLabel.textContent = 'Cảnh Báo Cao';
    riskLabel.className = 'text-xs font-bold uppercase tracking-widest text-on-tertiary-container';
    riskDesc.textContent = 'Môi trường kinh doanh biến động mạnh.';
  }

  // So sánh baseline
  const baselineParams = { INC:76, RAD:45, SPD:75, SEN:80, SEI:75, TRA:72, LEA:70, FIR:65, COP:75, RES:62 };
  const baselineResult = runSimulation(baselineParams);
  const diffPercent = ((finalRevenue - baselineResult.finalRevenue) / baselineResult.finalRevenue * 100).toFixed(1);
  const diffSign = diffPercent >= 0 ? '+' : '';
  const trendIcon = diffPercent >= 0 ? 'trending_up' : 'trending_down';
  const trendColor = diffPercent >= 0 ? 'text-secondary' : 'text-error';
  document.getElementById('revenueVsBaseline').innerHTML = `
    <span class="material-symbols-outlined text-sm mr-1 ${trendColor}">${trendIcon}</span>
    <span class="${trendColor}">${diffSign}${diffPercent}% so với Kịch Bản Cơ Sở</span>
  `;

  // ---------- 2. Carousel đóng góp ----------
  function calculateContributions(params, multDyn) {
    const inc = params.INC / 100, rad = params.RAD / 100, spd = params.SPD / 100, cop = params.COP / 100;
    const baseGrowth = (0.065 * inc + 0.105 * rad + 0.025 * spd + 0.015 * cop);
    const total = baseGrowth * multDyn;
    return [
      { name: 'Đầu tư Radical', value: (0.105 * rad * multDyn) / total * 100 },
      { name: 'Đầu tư Incremental', value: (0.065 * inc * multDyn) / total * 100 },
      { name: 'Năng lực Seizing', value: (0.15 * params.SEI/100 * baseGrowth) / total * 100 },
      { name: 'Năng lực Transforming', value: (0.18 * params.TRA/100 * baseGrowth) / total * 100 },
      { name: 'Hợp tác (COP)', value: (0.015 * cop * multDyn) / total * 100 }
    ].sort((a,b) => b.value - a.value).slice(0,5);
  }
  const multDyn = (1 + 0.12 * (params.SEN/100)) * (1 + 0.15 * (params.SEI/100)) * (1 + 0.18 * (params.TRA/100)) * (1 + 0.10 * (params.LEA/100)) * (1 + 0.08 * (params.FIR/100));
  const contributions = calculateContributions(params, multDyn);
  const carousel = document.getElementById('contributionCarousel');
  carousel.innerHTML = '';
  [...contributions, ...contributions].forEach(item => {
    const div = document.createElement('div');
    div.className = 'flex-none bg-surface-container-lowest p-4 rounded-lg w-56 shadow-sm';
    div.innerHTML = `
      <div class="flex justify-between text-xs mb-2 text-on-surface-variant">
        <span>${item.name}</span>
        <span class="font-bold text-primary">${item.value.toFixed(1)}%</span>
      </div>
      <div class="h-2 w-full bg-surface-container rounded-full overflow-hidden">
        <div class="h-full bg-secondary" style="width:${item.value}%"></div>
      </div>
    `;
    carousel.appendChild(div);
  });

  // ---------- 3. Verdict ----------
  function generateVerdict(risk, growthAvg, params) {
    let main, detail;
    if (growthAvg > 12 && risk > 60) {
      main = 'Chiến lược tăng trưởng mạnh nhưng đi kèm rủi ro cao';
      detail = `Với RAD=${params.RAD}% và SPD=${params.SPD}%, doanh thu tăng trưởng ấn tượng nhưng rủi ro hệ thống ${risk.toFixed(1)}/100. Cần tăng cường Sensing và Transforming.`;
    } else if (growthAvg < 5 && risk < 40) {
      main = 'Chiến lược an toàn, ổn định nhưng thiếu đột phá';
      detail = `Tập trung INC (${params.INC}%) giúp ổn định, nhưng tăng trưởng chỉ ${growthAvg.toFixed(1)}%. Cân nhắc tăng RAD.`;
    } else if (growthAvg < 0) {
      main = 'Cảnh báo: Tăng trưởng âm, cần tái cấu trúc';
      detail = `Đầu tư hiện tại không hiệu quả, doanh thu suy giảm. Xem lại cân bằng INC/RAD và năng lực động.`;
    } else {
      main = 'Chiến lược cân bằng, phù hợp dài hạn';
      detail = `INC=${params.INC}% và RAD=${params.RAD}% tạo nền tảng vững chắc. Năng lực động Sensing ${radar.Sensing.toFixed(0)}, Seizing ${radar.Seizing.toFixed(0)}.`;
    }
    return { main, detail };
  }
  const verdict = generateVerdict(risk, growthAvg, params);
  document.getElementById('verdictMain').textContent = verdict.main;
  document.getElementById('verdictDetail').textContent = verdict.detail;

  // ---------- 4. Biểu đồ ----------
  const yearlyData = simResult.yearly;
  const years = yearlyData.map(r => r.year);
  const revenues = yearlyData.map(r => r.revenue);
  const growthRates = yearlyData.slice(1).map(r => r.growth);
  
  new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: { labels: years, datasets: [{ label: 'Doanh thu (tỷ USD)', data: revenues, borderColor: '#00193c', backgroundColor: 'rgba(0,25,60,0.1)', tension: 0.3, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
  new Chart(document.getElementById('growthChart'), {
    type: 'bar',
    data: { labels: years.slice(1), datasets: [{ label: 'Tăng trưởng (%)', data: growthRates, backgroundColor: growthRates.map(v => v >= 0 ? '#006d33' : '#ba1a1a'), borderRadius: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
  });
  new Chart(document.getElementById('radarDynamic'), {
    type: 'radar',
    data: { labels: ['Sensing', 'Seizing', 'Transforming'], datasets: [{ data: [radar.Sensing, radar.Seizing, radar.Transforming], backgroundColor: 'rgba(0,45,98,0.2)', borderColor: '#002d62' }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100 } } }
  });
  const factorLabels = ['INC','RAD','SPD','SEN','SEI','TRA','LEA','FIR','COP','RES'];
  const factorValues = factorLabels.map(k => params[k] || 0);
  new Chart(document.getElementById('radarFactors'), {
    type: 'radar',
    data: { labels: factorLabels, datasets: [{ data: factorValues, backgroundColor: 'rgba(0,109,51,0.2)', borderColor: '#006d33' }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100 } } }
  });

  // ---------- 5. Phân tích chiến lược từ scenarios.json ----------
  fetch('data/scenarios.json')
    .then(res => res.json())
    .then(scenarios => {
      // Xác định template dựa trên kết quả và preset
      let templateKey = 'balanced';
      if (params.RAD > 70 && params.FIR > 70) templateKey = 'pio_succ';
      else if (params.RAD > 70 && params.SEN < 50) templateKey = 'pio_fail';
      else if (params.INC > 70 && params.RAD < 30) {
        templateKey = growthAvg > 5 ? 'seq_succ' : 'seq_fail';
      } else if (params.SPD > 80 && params.SEI > 80) templateKey = 'fol_succ';
      else if (params.SPD < 50 && params.LEA < 50) templateKey = 'fol_fail';
      else if (params.INC > 80 && params.COP > 70) templateKey = 'imi_succ';
      else if (params.RAD < 20 && params.INC < 60) templateKey = 'imi_fail';
      else if (params.INC + params.RAD > 110 && params.TRA < 50) templateKey = 'amb_fail';
      else templateKey = 'amb_opt';
      
      let text = scenarios.templates[templateKey] || scenarios.templates.amb_opt;
      text = text.replace('{{INC}}', params.INC)
                 .replace('{{RAD}}', params.RAD)
                 .replace('{{SPD}}', params.SPD)
                 .replace('{{SEN}}', params.SEN)
                 .replace('{{SEI}}', params.SEI)
                 .replace('{{TRA}}', params.TRA)
                 .replace('{{LEA}}', params.LEA)
                 .replace('{{FIR}}', params.FIR)
                 .replace('{{COP}}', params.COP)
                 .replace('{{growth_avg}}', growthAvg.toFixed(1))
                 .replace('{{risk}}', risk.toFixed(1))
                 .replace('{{sen}}', radar.Sensing.toFixed(0))
                 .replace('{{sei}}', radar.Seizing.toFixed(0))
                 .replace('{{tra}}', radar.Transforming.toFixed(0))
                 .replace('{{revenue_max}}', finalRevenue.toFixed(1));
      document.getElementById('analysisText').innerHTML = `<p>${text}</p>`;
    })
    .catch(() => {
      document.getElementById('analysisText').innerHTML = `<p>Phân tích chi tiết sẽ được cập nhật sau.</p>`;
    });

  // ---------- 6. Popup Cộng Tác Viên ----------
  const collabLink = document.getElementById('collabLink');
  const popup = document.getElementById('collabPopup');
  collabLink.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', () => {
    popup.style.display = 'none';
  });
});