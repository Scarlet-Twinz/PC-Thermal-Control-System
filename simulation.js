/**
 * PC Temperature Control System - Complete Working Simulation
 * Joel Jenom Jebson | B.Sc. Computer Science
 * Includes: Dark/Light mode, CSV Export, Challenge Mode, AI Prediction, Virtual PC Builder, Comparison Lab, LocalStorage
 */

// Component Class
class Component {
    constructor(name, minT, maxT) {
        this.name = name;
        this.minT = minT;
        this.maxT = maxT;
        this.temp = minT + 15;
        this.history = [];
    }
    
    update(workload, fan, ambient, cooling, powerFactor = 1) {
        let target = this.minT + (workload * powerFactor * (this.maxT - this.minT));
        let coolingEffect = fan * cooling * 20;
        let ambientEffect = (ambient - 25) * 0.5;
        let random = (Math.random() - 0.5) * 3;
        
        let newTemp = target - coolingEffect + ambientEffect + random;
        this.temp = this.temp * 0.7 + newTemp * 0.3;
        this.temp = Math.max(this.minT, Math.min(this.maxT, this.temp));
        
        this.history.push(this.temp);
        if (this.history.length > 60) this.history.shift();
        
        return Math.round(this.temp);
    }
    
    getStatus() {
        let range = this.maxT - this.minT;
        let percent = (this.temp - this.minT) / range;
        if (percent < 0.4) return { text: "Safe", color: "safe" };
        if (percent < 0.7) return { text: "Warning", color: "warning" };
        if (percent < 0.85) return { text: "Critical", color: "critical" };
        return { text: "Emergency", color: "emergency" };
    }
}

// Initialize components
let cpu = new Component("CPU", 25, 100);
let gpu = new Component("GPU", 30, 95);
let ram = new Component("RAM", 25, 80);
let mb = new Component("Motherboard", 25, 85);

// PC Builder variables
let pcPowerFactor = 1;
let coolerFactor = 1.4;

// Challenge mode variables
let challengeActive = false;
let challengeInterval = null;
let challengeScore = 0;
let challengeLevel = 1;
let originalWorkload = null;

// Global variables
let chart = null;
let historyLog = [];
let lastAlert = "";

// Load saved data from localStorage
function loadAllSavedData() {
    // Load theme
    let savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        let themeBtn = document.getElementById("themeToggle");
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light/Dark';
    }
    
    // Load history
    let savedHistory = localStorage.getItem("thermal_history");
    if (savedHistory) {
        historyLog = JSON.parse(savedHistory);
        let div = document.getElementById("historyLog");
        if (div && historyLog.length > 0) {
            div.innerHTML = historyLog.map(h => 
                `<div style="color: ${h.type === 'danger' ? '#ff8888' : '#aaa'}; margin: 3px 0;">[${h.time}] ${h.msg}</div>`
            ).join("");
        }
    }
    
    // Load last state
    let savedState = localStorage.getItem("thermal_state");
    if (savedState) {
        let s = JSON.parse(savedState);
        cpu.temp = s.cpu;
        gpu.temp = s.gpu;
        ram.temp = s.ram;
        mb.temp = s.mb;
        if (s.workload) document.getElementById("workload").value = s.workload;
        if (s.fan) document.getElementById("fan").value = s.fan;
        if (s.cooling) document.getElementById("cooling").value = s.cooling;
        if (s.ambient) document.getElementById("ambient").value = s.ambient;
        addHistory("Previous state loaded from storage", "info");
    }
    
    addHistory("System initialized - All features ready", "info");
}

// Add to history and save to localStorage
function addHistory(msg, type = "info") {
    let time = new Date().toLocaleTimeString();
    historyLog.unshift({ time, msg, type });
    if (historyLog.length > 30) historyLog.pop();
    
    let div = document.getElementById("historyLog");
    if (div) {
        div.innerHTML = historyLog.map(h => 
            `<div style="color: ${h.type === 'danger' ? '#ff8888' : '#aaa'}; margin: 3px 0;">[${h.time}] ${h.msg}</div>`
        ).join("");
    }
    
    localStorage.setItem("thermal_history", JSON.stringify(historyLog));
}

// Update UI
function updateUI() {
    let workload = parseFloat(document.getElementById("workload").value);
    let fan = parseInt(document.getElementById("fan").value) / 100;
    let ambient = parseInt(document.getElementById("ambient").value);
    let cooling = parseFloat(document.getElementById("cooling").value);
    
    let effectiveCooling = cooling * coolerFactor;
    
    let cpuTemp = cpu.update(workload, fan, ambient, effectiveCooling, pcPowerFactor);
    let gpuTemp = gpu.update(workload, fan, ambient, effectiveCooling, 1);
    let ramTemp = ram.update(workload, fan, ambient, effectiveCooling, 1);
    let mbTemp = mb.update(workload, fan, ambient, effectiveCooling, 1);
    
    // Update displays
    document.getElementById("cpuTemp").innerHTML = cpuTemp + '<span class="temp-unit">°C</span>';
    document.getElementById("gpuTemp").innerHTML = gpuTemp + '<span class="temp-unit">°C</span>';
    document.getElementById("ramTemp").innerHTML = ramTemp + '<span class="temp-unit">°C</span>';
    document.getElementById("mbTemp").innerHTML = mbTemp + '<span class="temp-unit">°C</span>';
    
    // Update progress bars
    document.getElementById("cpuBar").style.width = ((cpuTemp-25)/75*100)+'%';
    document.getElementById("gpuBar").style.width = ((gpuTemp-30)/65*100)+'%';
    document.getElementById("ramBar").style.width = ((ramTemp-25)/55*100)+'%';
    document.getElementById("mbBar").style.width = ((mbTemp-25)/60*100)+'%';
    
    // Update statuses
    let cpuStat = cpu.getStatus();
    let gpuStat = gpu.getStatus();
    let ramStat = ram.getStatus();
    let mbStat = mb.getStatus();
    
    document.getElementById("cpuStatus").innerHTML = cpuStat.text;
    document.getElementById("gpuStatus").innerHTML = gpuStat.text;
    document.getElementById("ramStatus").innerHTML = ramStat.text;
    document.getElementById("mbStatus").innerHTML = mbStat.text;
    
    document.getElementById("cpuTemp").className = `temp-value temp-${cpuStat.color}`;
    document.getElementById("gpuTemp").className = `temp-value temp-${gpuStat.color}`;
    document.getElementById("ramTemp").className = `temp-value temp-${ramStat.color}`;
    document.getElementById("mbTemp").className = `temp-value temp-${mbStat.color}`;
    
    // Update health score
    let avg = (cpuTemp + gpuTemp + ramTemp + mbTemp) / 4;
    let health = Math.max(0, Math.min(100, Math.round(100 - ((avg-30)/70*100))));
    document.getElementById("healthScore").innerHTML = health;
    document.getElementById("healthBar").style.width = health + '%';
    
    if (health >= 80) {
        document.getElementById("healthMsg").innerHTML = "Excellent - All systems nominal";
        document.getElementById("healthBar").className = "progress-bar bg-success";
    } else if (health >= 60) {
        document.getElementById("healthMsg").innerHTML = "Good - Monitor recommended";
        document.getElementById("healthBar").className = "progress-bar bg-warning";
    } else if (health >= 40) {
        document.getElementById("healthMsg").innerHTML = "Warning - Check cooling";
        document.getElementById("healthBar").className = "progress-bar bg-danger";
    } else {
        document.getElementById("healthMsg").innerHTML = "CRITICAL - Immediate action needed";
        document.getElementById("healthBar").className = "progress-bar bg-danger";
    }
    
    // Update displays
    document.getElementById("fanVal").innerHTML = Math.round(fan*100);
    document.getElementById("ambientVal").innerHTML = ambient;
    
    // Update alerts (NO SPAM)
    let alerts = [];
    if (cpuStat.text === "Emergency") alerts.push(`CPU: ${cpuTemp}°C`);
    if (gpuStat.text === "Emergency") alerts.push(`GPU: ${gpuTemp}°C`);
    if (ramStat.text === "Emergency") alerts.push(`RAM: ${ramTemp}°C`);
    if (mbStat.text === "Emergency") alerts.push(`Motherboard: ${mbTemp}°C`);
    
    let alertDiv = document.getElementById("alertMsg");
    if (alerts.length > 0) {
        alertDiv.innerHTML = `<span class="text-danger">⚠️ EMERGENCY: ${alerts.join(", ")} - Increase fan speed now!</span>`;
    } else if (cpuStat.text === "Critical" || gpuStat.text === "Critical") {
        alertDiv.innerHTML = `<span class="text-warning">⚠️ Warning: Some components are reaching critical temperatures</span>`;
    } else {
        alertDiv.innerHTML = `✅ No active alerts - System normal`;
    }
    
    // Update recommendations
    let recDiv = document.getElementById("recMsg");
    if (avg > 75) {
        recDiv.innerHTML = "🚨 CRITICAL: Increase fan speed immediately or reduce workload!";
    } else if (avg > 65) {
        recDiv.innerHTML = "⚠️ Warning: Consider upgrading cooling system or improving airflow.";
    } else if (fan < 0.5 && avg > 55) {
        recDiv.innerHTML = "💡 Tip: Increase fan speed to improve cooling performance.";
    } else {
        recDiv.innerHTML = "✅ System operating within optimal parameters. No action needed.";
    }
    
    // Update Virtual PC Builder message
    let builderMsg = document.getElementById("builderMsg");
    if (builderMsg) {
        let totalHeat = pcPowerFactor;
        let coolingCap = coolerFactor;
        if (coolingCap >= totalHeat * 1.3) {
            builderMsg.innerHTML = "✅ Great cooling for this CPU!";
            builderMsg.style.color = "#00ff88";
        } else if (coolingCap >= totalHeat) {
            builderMsg.innerHTML = "⚠️ Adequate cooling - consider upgrade for heavy loads";
            builderMsg.style.color = "#ffaa00";
        } else {
            builderMsg.innerHTML = "🔥 Cooling insufficient for this CPU! Upgrade recommended!";
            builderMsg.style.color = "#ff0033";
        }
    }
    
    // Update comparison lab
    let compareCooling = parseFloat(document.getElementById("compareCooling").value);
    let compareTemp = cpu.minT + (workload * pcPowerFactor * (cpu.maxT - cpu.minT)) - (fan * compareCooling * 20) + ((ambient - 25) * 0.5);
    compareTemp = Math.max(cpu.minT, Math.min(cpu.maxT, compareTemp));
    let currentTempForCompare = cpuTemp;
    let diff = currentTempForCompare - compareTemp;
    let compareDiv = document.getElementById("compareResult");
    if (compareDiv) {
        if (diff > 5) {
            compareDiv.innerHTML = `✅ Selected cooling would be ${Math.round(diff)}°C cooler. Upgrade recommended!`;
            compareDiv.style.color = "#00ff88";
        } else if (diff > 0) {
            compareDiv.innerHTML = `📈 Selected cooling would be ${Math.round(diff)}°C cooler. Minor improvement.`;
            compareDiv.style.color = "#ffaa00";
        } else {
            compareDiv.innerHTML = `⚠️ Selected cooling performs similarly or worse. No upgrade needed.`;
            compareDiv.style.color = "#ff8888";
        }
    }
    
    // Update challenge mode display
    if (challengeActive) {
        document.getElementById("challengeScore").innerHTML = challengeScore;
        document.getElementById("challengeLevel").innerHTML = challengeLevel;
    }
    
    // Update chart
    updateChart(cpuTemp, gpuTemp, ramTemp, mbTemp);
}

// Chart - FIXED VERSION
function initChart() {
    let ctx = document.getElementById("tempChart").getContext("2d");
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'CPU', data: [], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', tension: 0.3, fill: true },
                { label: 'GPU', data: [], borderColor: '#ff6600', backgroundColor: 'rgba(255,102,0,0.1)', tension: 0.3, fill: true },
                { label: 'RAM', data: [], borderColor: '#ffaa00', backgroundColor: 'rgba(255,170,0,0.1)', tension: 0.3, fill: true },
                { label: 'MB', data: [], borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)', tension: 0.3, fill: true }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top', labels: { color: '#e0e0e0' } }
            },
            scales: { 
                y: { 
                    min: 20, 
                    max: 105, 
                    title: { display: true, text: 'Temperature (°C)', color: '#e0e0e0' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: { 
                    title: { display: true, text: 'Seconds ago', color: '#e0e0e0' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

function updateChart(c, g, r, m) {
    if (!chart) {
        // Re-initialize if missing
        initChart();
    }
    
    if (!chart) return;
    
    // Add new data points
    chart.data.datasets[0].data.push(c);
    chart.data.datasets[1].data.push(g);
    chart.data.datasets[2].data.push(r);
    chart.data.datasets[3].data.push(m);
    
    // Keep only last 30 readings
    if (chart.data.datasets[0].data.length > 30) {
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
        chart.data.datasets[3].data.shift();
    }
    
    // Update labels (show seconds ago)
    let labels = [];
    for (let i = chart.data.datasets[0].data.length - 1; i >= 0; i--) {
        labels.push(chart.data.datasets[0].data.length - i);
    }
    chart.data.labels = labels;
    
    chart.update('none');
}

// Save/Load functions
function saveState() {
    let state = {
        cpu: cpu.temp,
        gpu: gpu.temp,
        ram: ram.temp,
        mb: mb.temp,
        workload: document.getElementById("workload").value,
        fan: document.getElementById("fan").value,
        cooling: document.getElementById("cooling").value,
        ambient: document.getElementById("ambient").value
    };
    localStorage.setItem("thermal_state", JSON.stringify(state));
    addHistory("System state saved to browser", "info");
    alert("✅ State saved to localStorage!");
}

function loadState() {
    let state = localStorage.getItem("thermal_state");
    if (!state) { alert("No saved state found!"); return; }
    let s = JSON.parse(state);
    cpu.temp = s.cpu;
    gpu.temp = s.gpu;
    ram.temp = s.ram;
    mb.temp = s.mb;
    document.getElementById("workload").value = s.workload;
    document.getElementById("fan").value = s.fan;
    document.getElementById("cooling").value = s.cooling;
    document.getElementById("ambient").value = s.ambient;
    addHistory("Previous state loaded from browser", "info");
    alert("✅ State loaded from localStorage!");
    updateUI();
}

function clearHistory() {
    if (confirm("Clear all history and saved data from browser?")) {
        localStorage.removeItem("thermal_history");
        localStorage.removeItem("thermal_state");
        historyLog = [];
        document.getElementById("historyLog").innerHTML = "";
        addHistory("History cleared from browser", "warning");
        alert("✅ History cleared from localStorage!");
    }
}

// PDF Export
function exportPDF() {
    let win = window.open("", "_blank");
    win.document.write(`
        <html><head><title>Thermal Report - Joel Jenom</title>
        <style>body{font-family:Arial;padding:40px}</style>
        </head><body>
        <h1>PC Temperature Control System</h1>
        <p><strong>Joel Jenom Jebson</strong> | ${new Date().toLocaleString()}</p>
        <h3>Current Readings:</h3>
        <p>CPU: ${Math.round(cpu.temp)}°C | GPU: ${Math.round(gpu.temp)}°C</p>
        <p>RAM: ${Math.round(ram.temp)}°C | Motherboard: ${Math.round(mb.temp)}°C</p>
        <p>Health Score: ${document.getElementById("healthScore").innerText}</p>
        <p>Workload: ${document.getElementById("workload").options[document.getElementById("workload").selectedIndex].text}</p>
        <p>Fan Speed: ${document.getElementById("fan").value}%</p>
        <footer>Generated by PC Thermal Control System - Joel Jenom Jebson</footer>
        </body></html>
    `);
    win.document.close();
    win.print();
    addHistory("PDF report generated", "info");
}

// CSV Export
function exportCSV() {
    let now = new Date();
    let csvRows = [
        [`"PC Thermal Report - Joel Jenom Jebson"`],
        [`"Date","${now.toLocaleString()}"`],
        [`"Component","Temperature (°C)","Status"`],
        [`"CPU",${Math.round(cpu.temp)},"${cpu.getStatus().text}"`],
        [`"GPU",${Math.round(gpu.temp)},"${gpu.getStatus().text}"`],
        [`"RAM",${Math.round(ram.temp)},"${ram.getStatus().text}"`],
        [`"Motherboard",${Math.round(mb.temp)},"${mb.getStatus().text}"`],
        [`"Health Score",${document.getElementById("healthScore").innerText},"${document.getElementById("healthMsg").innerText}"`],
        [`"Workload","${document.getElementById("workload").options[document.getElementById("workload").selectedIndex].text}",""`],
        [`"Fan Speed",${document.getElementById("fan").value}%,""`]
    ];
    
    let csvContent = csvRows.map(row => row.join(",")).join("\n");
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `thermal_report_${now.toISOString().slice(0,19)}.csv`;
    link.click();
    addHistory("CSV file exported", "info");
    alert("✅ CSV exported!");
}

// AI Prediction
function predictTemp(minutes) {
    function calcPrediction(history) {
        if (history.length < 10) return history[history.length-1] || 50;
        let n = Math.min(history.length, 30);
        let recent = history.slice(-n);
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < recent.length; i++) {
            sumX += i;
            sumY += recent[i];
            sumXY += i * recent[i];
            sumX2 += i * i;
        }
        let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        let intercept = (sumY - slope * sumX) / n;
        let predicted = intercept + slope * (recent.length + minutes * 10);
        return Math.min(105, Math.max(25, Math.round(predicted)));
    }
    
    let predCpu = calcPrediction(cpu.history);
    let predGpu = calcPrediction(gpu.history);
    let avgPred = (predCpu + predGpu) / 2;
    let resultDiv = document.getElementById("predictionResult");
    
    if (avgPred > 85) {
        resultDiv.innerHTML = `🚨 ${minutes}min: CPU ${predCpu}°C | GPU ${predGpu}°C - OVERHEAT RISK!`;
        resultDiv.style.color = "#ff8888";
    } else if (avgPred > 75) {
        resultDiv.innerHTML = `⚠️ ${minutes}min: CPU ${predCpu}°C | GPU ${predGpu}°C - Critical soon`;
        resultDiv.style.color = "#ffaa00";
    } else {
        resultDiv.innerHTML = `✅ ${minutes}min: CPU ${predCpu}°C | GPU ${predGpu}°C - Stable`;
        resultDiv.style.color = "#00ff88";
    }
    addHistory(`AI Prediction: ${minutes}min - CPU ${predCpu}°C, GPU ${predGpu}°C`, "info");
}

// Challenge Mode
function startChallenge() {
    challengeActive = true;
    challengeScore = 0;
    challengeLevel = 1;
    let secondsElapsed = 0;
    
    document.getElementById("startChallengeBtn").style.display = "none";
    document.getElementById("stopChallengeBtn").style.display = "inline-block";
    document.getElementById("challengeMsg").innerHTML = "🎮 ACTIVE! Keep temps below 80°C!";
    
    originalWorkload = document.getElementById("workload").value;
    document.getElementById("workload").value = "0.2";
    document.getElementById("workload").dispatchEvent(new Event("change"));
    
    if (challengeInterval) clearInterval(challengeInterval);
    challengeInterval = setInterval(() => {
        if (!challengeActive) return;
        secondsElapsed++;
        challengeScore = secondsElapsed;
        
        if (secondsElapsed % 30 === 0 && secondsElapsed > 0) {
            challengeLevel++;
            let newWorkload = Math.min(1.0, 0.2 + (challengeLevel * 0.1));
            document.getElementById("workload").value = newWorkload.toString();
            document.getElementById("workload").dispatchEvent(new Event("change"));
            document.getElementById("challengeMsg").innerHTML = `⚠️ LEVEL ${challengeLevel}! Workload increased!`;
        }
        
        let avgTemp = (cpu.temp + gpu.temp + ram.temp + mb.temp) / 4;
        if (avgTemp > 80) {
            endChallenge(false);
        }
        
        document.getElementById("challengeScore").innerHTML = challengeScore;
        document.getElementById("challengeLevel").innerHTML = challengeLevel;
    }, 1000);
    
    addHistory("Challenge Mode Started", "info");
}

function endChallenge(won) {
    challengeActive = false;
    if (challengeInterval) clearInterval(challengeInterval);
    
    if (originalWorkload) {
        document.getElementById("workload").value = originalWorkload;
        document.getElementById("workload").dispatchEvent(new Event("change"));
    }
    
    document.getElementById("startChallengeBtn").style.display = "inline-block";
    document.getElementById("stopChallengeBtn").style.display = "none";
    
    if (won) {
        document.getElementById("challengeMsg").innerHTML = `🏆 VICTORY! Score: ${challengeScore} | Level ${challengeLevel}`;
        addHistory(`Challenge Complete! Score: ${challengeScore}, Level: ${challengeLevel}`, "info");
    } else {
        document.getElementById("challengeMsg").innerHTML = `💀 GAME OVER! Score: ${challengeScore} | Level ${challengeLevel}`;
        addHistory(`Challenge Failed at Level ${challengeLevel}, Score ${challengeScore}`, "danger");
    }
    setTimeout(() => {
        if (!challengeActive) document.getElementById("challengeMsg").innerHTML = "";
    }, 3000);
}

function stopChallenge() {
    endChallenge(true);
}

// Dark/Light Mode Toggle
function toggleTheme() {
    let body = document.body;
    if (body.classList.contains("light-theme")) {
        body.classList.remove("light-theme");
        localStorage.setItem("theme", "dark");
        document.getElementById("themeToggle").innerHTML = '<i class="fas fa-moon"></i> Dark/Light';
        addHistory("Switched to Dark Mode", "info");
    } else {
        body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
        document.getElementById("themeToggle").innerHTML = '<i class="fas fa-sun"></i> Light/Dark';
        addHistory("Switched to Light Mode", "info");
    }
}

// Virtual PC Builder update
function updatePCBuilder() {
    let cpuWatt = parseInt(document.getElementById("cpuModel").value);
    pcPowerFactor = cpuWatt / 65;
    coolerFactor = parseFloat(document.getElementById("coolerModel").value);
    addHistory(`PC Builder: CPU ${cpuWatt}W, Cooler ${coolerFactor}x`, "info");
}

// Event listeners
function setupEvents() {
    let saveBtn = document.getElementById("saveBtn");
    let loadBtn = document.getElementById("loadBtn");
    let clearBtn = document.getElementById("clearBtn");
    let pdfBtn = document.getElementById("pdfBtn");
    let csvBtn = document.getElementById("csvBtn");
    let themeBtn = document.getElementById("themeToggle");
    let startChallengeBtn = document.getElementById("startChallengeBtn");
    let stopChallengeBtn = document.getElementById("stopChallengeBtn");
    let predict5Btn = document.getElementById("predict5Btn");
    let predict10Btn = document.getElementById("predict10Btn");
    let predict30Btn = document.getElementById("predict30Btn");
    let cpuModel = document.getElementById("cpuModel");
    let coolerModel = document.getElementById("coolerModel");
    let workload = document.getElementById("workload");
    let fan = document.getElementById("fan");
    let cooling = document.getElementById("cooling");
    let ambient = document.getElementById("ambient");
    let compareCooling = document.getElementById("compareCooling");
    
    if (saveBtn) saveBtn.onclick = saveState;
    if (loadBtn) loadBtn.onclick = loadState;
    if (clearBtn) clearBtn.onclick = clearHistory;
    if (pdfBtn) pdfBtn.onclick = exportPDF;
    if (csvBtn) csvBtn.onclick = exportCSV;
    if (themeBtn) themeBtn.onclick = toggleTheme;
    if (startChallengeBtn) startChallengeBtn.onclick = startChallenge;
    if (stopChallengeBtn) stopChallengeBtn.onclick = stopChallenge;
    if (predict5Btn) predict5Btn.onclick = () => predictTemp(5);
    if (predict10Btn) predict10Btn.onclick = () => predictTemp(10);
    if (predict30Btn) predict30Btn.onclick = () => predictTemp(30);
    if (cpuModel) cpuModel.onchange = updatePCBuilder;
    if (coolerModel) coolerModel.onchange = updatePCBuilder;
    if (compareCooling) compareCooling.onchange = () => updateUI();
    
    if (workload) workload.onchange = () => addHistory(`Workload changed to ${workload.options[workload.selectedIndex].text}`);
    if (fan) fan.oninput = () => { if(document.getElementById("fanVal")) document.getElementById("fanVal").innerHTML = fan.value; };
    if (cooling) cooling.onchange = () => addHistory(`Cooling changed to ${cooling.options[cooling.selectedIndex].text}`);
    if (ambient) ambient.oninput = () => { if(document.getElementById("ambientVal")) document.getElementById("ambientVal").innerHTML = ambient.value; };
}

// Start everything
document.addEventListener("DOMContentLoaded", () => {
    // Small delay to ensure canvas is ready
    setTimeout(() => {
        initChart();
    }, 100);
    loadAllSavedData();
    setupEvents();
    updatePCBuilder();
    setInterval(updateUI, 1000);
    addHistory("Ready - All features active", "info");
});