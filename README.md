<img width="1058" height="176" src="RoboSIM.png">

RoboSim 3D is a hardware-accelerated 3D robotic arm simulation built from scratch using vanilla JavaScript and **Three.js**. It implements real-time **Inverse Kinematics (IK)** matrix math to calculate multi-joint actuator angles instantly based on cursor tracking coordinates. 

The simulation layer is built to mimic real industrial automation control units, featuring dynamic path caching, a custom telemetry sub-engine, and high-performance frame loop processing.

---

<details>
<summary><b>Contents</b></summary>

- [✨ Key Features](#-key-features)
- [📁 Project Structure](#project-structure)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [⚙️ Quick Start](#%EF%B8%8F-quick-start)

</details>

---

## ✨ Key Features

* **Real-Time Inverse Kinematics (IK) Solver:** You don't manual control each joint. The engine takes your 3D target coordinates ($X, Y, Z$) from the viewport and handles the trigonometric cosine/tangent matrix routing to position the base, shoulder, and elbow segments dynamically.
* **Path Caching & Playback Automation:** Features a pipeline sequencer that caches positional vectors in real time when recording. You can execute loop playbacks of your path at multiple Variable Frequency Drive (VFD) speeds ($0.4\text{x}$ slow-motion up to a $3.5\text{x}$ clock speed).
* **Live Telemetry & Velocity Profiling:** Tracks physical metrics on the fly. A secondary HTML5 Canvas pipeline monitors absolute velocity deltas at the tool center point (gripper tip) and plots a live kinematic trend graph.
* **Interactive 5-Axis Gripper Assembly:** Constructs a hierarchical object tree mapping nested mesh groups (Base $\rightarrow$ Shoulder $\rightarrow$ Elbow $\rightarrow$ Wrist Gripper $\rightarrow$ Actuator Finger Bones) so rotations flow correctly through parent-child transformations.
* **Motion Blur & Frame Pipelining:** Implements a layered rendering sequence that bypasses simple clear-buffer commands, applying an overlay quad mask with fractional opacity to achieve subtle, glassy vector motion trails.
* **Environment Theme Toggling:** Easily swap workspace visuals from a high-tech dark matrix lab layout into a minimalist, clean industrial manufacturing blueprint mode.

---

## 📁 Project Structure

* `script.js` — Core 3D scene configuration, Inverse Kinematics math solver, rendering pipeline layers, and button action logic.
* `index.html` — Structural layout, telemetry readout panel, and canvas wrapper frames.
* `style.css` — Modern frosted-glass look (`backdrop-filter`), CSS theme inversion variables, and responsive grid alignment.

---

## 🛠️ Tech Stack

* **Graphics Matrix:** Three.js (WebGL Context, Crisp-Edge Anti-Aliasing)
* **Core Language:** Vanilla JavaScript (ES6+), HTML5 Canvas 2D (Telemetry overlay)
* **Typography & Styles:** CSS3, Google Fonts (*Inter* & *JetBrains Mono*)

---

## ⚙️ Quick Start

This project runs completely on native browser web standards—no bundlers, Webpack setups, or `npm` dependencies required.

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/your-username/robosim3d.git](https://github.com/your-username/robosim3d.git)
   cd robosim3d
