# PC Thermal Control System

A browser-based simulation of personal computer temperature control and thermal management. The project models component temperatures under different workloads, fan speeds, ambient temperatures, and cooling configurations, then visualizes the results through an interactive dashboard.

> **Project context:** The interface presents the work as a simulation/final-year project rather than a direct hardware-control application.

## Features

- Real-time simulated temperature readings for CPU, GPU, RAM, and motherboard
- Component status indicators: Safe, Warning, Critical, and Emergency
- System health score based on simulated component temperatures
- Workload controls for Idle, Office, Programming, Video Editing, Gaming, and AI Training scenarios
- Adjustable fan speed and ambient temperature
- Cooling configuration comparison: air, water, and hybrid cooling
- Virtual PC Builder for comparing CPU power and cooler configurations
- Thermal Challenge Mode with score and level tracking
- Short-term temperature prediction controls
- Temperature history chart using Chart.js
- Dark/light theme toggle
- Browser-based state and event-history persistence with `localStorage`
- CSV export, PDF report, save/load state, and history-clearing controls
- Alerts and cooling recommendations based on simulated thermal conditions
- Responsive interface for desktop and smaller screens

## How the Simulation Works

The core simulation models each component with minimum and maximum temperature ranges. Temperature is recalculated from workload, fan speed, ambient temperature, cooling effectiveness, and a small random variation to make the simulation dynamic.

The dashboard then updates component temperatures, status levels, health score, alerts, recommendations, and the historical chart.

This is a **simulation**: the current implementation does not directly read physical CPU/GPU sensors or send PWM signals to real fans.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3
- Font Awesome
- Chart.js
- Browser `localStorage`

## Project Structure

```text
PC-Thermal-Control-System/
├── index.html        # Dashboard and controls
├── style.css         # Application styling and responsive layout
└── simulation.js     # Thermal simulation and interactive behavior
```

## Running Locally

No package installation or backend server is required for the current browser-based implementation.

1. Clone the repository.
2. Open `index.html` in a modern browser.
3. Adjust workload, fan speed, ambient temperature, and cooling options.
4. Explore the challenge, prediction, PC builder, comparison, chart, and data-management features.

Because the page loads Bootstrap, Font Awesome, and Chart.js from CDNs, an internet connection may be required for those external assets when running the page directly.

## Simulation Controls

### Workload

The dashboard provides several simulated workload levels, from idle operation through high-load scenarios such as gaming and AI training.

### Cooling

Fan speed, ambient temperature, and cooling type affect the calculated temperature values. The Virtual PC Builder also changes the CPU power/cooling factors used by the simulation.

### Thermal Challenge

Challenge Mode turns the thermal model into an interactive exercise where the goal is to keep simulated component temperatures below the displayed threshold while workload increases.

## Data Persistence

The application uses browser `localStorage` for client-side persistence, including:

- Theme preference
- Thermal event history
- Saved thermal state

No database or external application backend is required by the current implementation.

## Author

**Anthony Emmanuella Mmasinachi**

## Notes

The repository contains a front-end simulation and visualization rather than verified physical hardware-control infrastructure. Claims about real sensor access, PWM fan control, databases, production monitoring, or hardware safety should not be inferred from this project.

## Project Links

- **Repository:** https://github.com/Scarlet-Twinz/PC-Thermal-Control-System
- **Author:** Anthony Emmanuella Mmasinachi
- **GitHub:** https://github.com/Scarlet-Twinz
