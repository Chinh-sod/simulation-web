from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

# Khởi tạo Flask với đường dẫn tĩnh linh hoạt hơn
# Sử dụng os.path.abspath để đảm bảo đường dẫn chính xác trên server Render
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.abspath(os.path.join(current_dir, '..'))

app = Flask(__name__, static_folder=static_dir, static_url_path='')
CORS(app)

# --- LOGIC TÍNH TOÁN (Giữ nguyên từ code của bạn) ---
def calculate_simulation(inputs, years=[2026, 2027, 2028, 2029, 2030]):
    results = []
    base_revenue = 5
    current_revenue = base_revenue

    inc = inputs.get("INC", 50)
    rad = inputs.get("RAD", 50)
    spd = inputs.get("SPD", 50)
    sen = inputs.get("SEN", 50)
    sei = inputs.get("SEI", 50)
    tra = inputs.get("TRA", 50)
    lea = inputs.get("LEA", 50)
    fir = inputs.get("FIR", 50)
    cop = inputs.get("COP", 50)
    res = inputs.get("RES", 50)
    ext = inputs.get("EXT", 0.0)

    mult_dyn = ((1 + 0.12 * (sen/100)) *
                (1 + 0.15 * (sei/100)) *
                (1 + 0.18 * (tra/100)) *
                (1 + 0.10 * (lea/100)) *
                (1 + 0.08 * (fir/100)))

    risk_score = (25 * (inc/100) + 55 * (rad/100) - 15 * (spd/100) - 12 * (cop/100) - 
                  8 * (sen/100) - 10 * (sei/100) - 12 * (tra/100) - 6 * (lea/100))
    risk_score = max(0, min(100, risk_score))

    for t in range(len(years)):
        rad_efficiency = 0.4 if t < 2 else 1.0
        base_growth = (0.065 * (inc/100) + 0.105 * (rad/100 * rad_efficiency) + 
                       0.025 * (spd/100) + 0.015 * (cop/100))
        growth_t = base_growth * mult_dyn * (1 + ext)
        total_inv = inc + rad
        if total_inv > 110:
            growth_t *= (1 - 0.005 * (total_inv - 110))
        current_revenue *= (1 + growth_t)
        results.append({
            "year": years[t],
            "revenue": round(current_revenue, 2),
            "growth_rate": round(growth_t * 100, 2)
        })

    radar_metrics = {
        "Sensing": 55 + 0.25*sen + 0.15*lea + 0.10*cop + 0.08*fir,
        "Seizing": 50 + 0.30*sei + 0.20*spd + 0.15*rad + 0.12*cop,
        "Transforming": 48 + 0.35*tra + 0.18*inc + 0.15*spd + 0.10*lea
    }
    radar_metrics = {k: min(100.0, max(0.0, round(v, 2))) for k, v in radar_metrics.items()}

    return {
        "yearly_results": results,
        "risk": round(risk_score, 2),
        "radar": radar_metrics,
        "growth_avg": round(sum(r["growth_rate"] for r in results)/len(results), 2),
        "final_revenue": results[-1]["revenue"]
    }

# --- ROUTES ---
@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data"}), 400
    return jsonify(calculate_simulation(data))

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)