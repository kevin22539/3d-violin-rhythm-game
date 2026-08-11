# 🎻 Interactive 3D Violin Rhythm Game

An interactive web-based 3D violin experience built with **Three.js** and the **Web Audio API**.

The project combines real-time 3D graphics, mouse-based bow interaction, keyboard-controlled fingering, procedural violin audio, melody demonstrations, and a rhythm-game challenge mode.

This project was developed as a group project for the **Computer Graphics** course at the **University of Technology Sydney (UTS)**.

<p align="center">
  <img src="./images/demo1.png" alt="Violin Rhythm Game Demo" width="800">
</p>
---

## Overview

The goal of this project was to explore how computer graphics and interaction techniques can be combined to create a playable virtual violin.

Instead of treating the violin as a static 3D model, the system allows the user to interact with the instrument:

* Move the bow using the mouse
* Select violin strings using the keyboard
* Select finger positions to change pitch
* Detect contact between the bow and strings in 3D space
* Generate violin-like sound in real time
* Follow melody demonstrations
* Play the melody back in Challenge Mode

The final system integrates **3D rendering, geometric transformations, model loading, collision-region detection, interactive input, real-time audio synthesis, and gameplay logic**.

---

## Key Features

### 3D Scene and Models

* Interactive 3D scene rendered with Three.js
* GLB models for the violin, bow, and environment
* Camera and OrbitControls for scene navigation
* Ambient, directional, and point lighting
* Automatic model centering and scaling using bounding boxes
* Independent transformation of violin, bow, and environment models

### Bow Interaction

* Mouse-controlled virtual violin bow
* Click-to-toggle performance mode
* Bow movement constrained to an interaction plane for intuitive 2D mouse control in a 3D environment
* Multi-sample bow-string contact detection
* String-specific spatial detection regions
* Bow velocity and direction tracking

### Violin Input

The keyboard represents the left hand of the violin player.

| Input | Function |
| ----- | -------- |
| `A`   | G string |
| `S`   | D string |
| `D`   | A string |
| `F`   | E string |
| `1`   | Finger 1 |
| `2`   | Finger 2 |
| `3`   | Finger 3 |
| `4`   | Finger 4 |

Releasing all finger keys plays the open-string note.

### Pitch Mapping

Pitch is determined using a combination of:

```text
String + Finger Position → Note → Frequency
```

Example:

| String | Open | Finger 1 | Finger 2 | Finger 3 | Finger 4 |
| ------ | ---- | -------- | -------- | -------- | -------- |
| G      | G3   | A3       | B3       | C4       | D4       |
| D      | D4   | E4       | F#4      | G4       | A4       |
| A      | A4   | B4       | C#5      | D5       | E5       |
| E      | E5   | F#5      | G5       | A5       | B5       |

### Real-Time Audio

The project uses the **Web Audio API** to synthesize the violin sound directly in the browser.

The audio system includes:

* Multi-harmonic oscillator synthesis
* Body-resonance filtering
* Vibrato
* Bow-speed response
* Bow-direction change detection
* Friction transient effects during bow reversal

No prerecorded violin note samples are required for the main synthesis system.

### Visual Feedback

The interface provides real-time visual feedback including:

* Active-string highlighting
* Finger-position indicators
* Current note / key information
* Camera presets
* Playing status
* Score and combo information
* Demo and challenge transitions

### Demo Mode

The system can automatically demonstrate melodies while synchronizing:

* Pitch
* Audio
* String highlighting
* Finger-position visualization
* UI feedback

Included melodies include:

* **Twinkle Twinkle Little Star**
* **Ode to Joy**

### Challenge Mode

After watching a demonstration, the player can attempt to perform the melody.

The challenge system includes:

* Countdown
* Metronome
* Real-time note judging
* Score tracking
* Combo tracking

---

## System Architecture

The project is divided into independent modules based on responsibility.

```text
User Input
   │
   ├── Mouse ──────► Bow Controller
   │                     │
   │                     ▼
   │              Bow Motion Tracker
   │                     │
   │                     ▼
   │              String Detection
   │
   └── Keyboard ──► String / Finger Input
                         │
                         ▼
                     Pitch Map
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
      Web Audio Engine          Gameplay Logic
            │                         │
            └────────────┬────────────┘
                         ▼
                 Visual Feedback
                         │
                         ▼
                 Three.js Renderer
```

---

## Bow-String Detection

One of the core interaction problems is determining whether the virtual bow is touching a violin string.

A single-point collision test makes bowing difficult because the center of the bow would need to align very precisely with a string.

The project instead represents the bow hair using multiple sampled points along its length.

```text
Bow Frog ●──●──●──●──●──●──●──●──●──●──● Bow Tip
           ↑
        sampled
         points
```

For each frame:

1. The world-space positions of the bow-hair endpoints are calculated.
2. Multiple points are interpolated along the bow hair.
3. Each sample is checked against the bow interaction region.
4. Its distance from every violin string is calculated.
5. The closest valid string is selected.
6. Enter/leave thresholds reduce unstable switching between strings.

This allows a much larger portion of the bow to interact naturally with the strings.

---

## Model Loading and Transformation

The violin, bow, and environment are loaded as GLB models using `GLTFLoader`.

Because imported models can have different origins, orientations, and scales, the loader normalizes each model before adding it to the scene.

The general process is:

```text
Load GLB
   ↓
Compute Bounding Box
   ↓
Find Model Center
   ↓
Move Model to Local Origin
   ↓
Normalize Scale
   ↓
Apply Rotation
   ↓
Apply World Position
   ↓
Add to Scene
```

A parent `THREE.Group` is used as the model root so that local model normalization and world-space placement can be handled separately.

---

## Project Structure

```text
violin-rhythm-game-scaffold/
│
├── index.html
├── style.css
├── README.md
├── CREDITS.md
│
├── assets/
│   └── models/
│       ├── violin.glb
│       ├── bow.glb
│       └── the_great_drawing_room.glb
│
├── src/
│   │
│   ├── main.js
│   │
│   ├── core/
│   │   ├── scene.js
│   │   ├── camera.js
│   │   ├── renderer.js
│   │   ├── lights.js
│   │   ├── setupScene.js
│   │   ├── animationLoop.js
│   │   └── cameraController.js
│   │
│   ├── loaders/
│   │   ├── loadAllAssets.js
│   │   ├── loadViolin.js
│   │   ├── loadBow.js
│   │   └── loadEnvironment.js
│   │
│   ├── violin/
│   │   ├── bowController.js
│   │   ├── bowMotionTracker.js
│   │   ├── stringDetector.js
│   │   ├── stringZones.js
│   │   └── setupBowDetection.js
│   │
│   ├── input/
│   │   ├── keyboardInput.js
│   │   ├── fingerInput.js
│   │   └── mouseInput.js
│   │
│   ├── audio/
│   │   ├── violinAudio.js
│   │   └── metronome.js
│   │
│   ├── gameplay/
│   │   ├── pitchMap.js
│   │   ├── fingerboardDots.js
│   │   ├── fingerboardPositions.js
│   │   ├── setupFingerboard.js
│   │   ├── melodyPlayer.js
│   │   ├── demoFlow.js
│   │   ├── judge.js
│   │   ├── score.js
│   │   ├── noteChart.js
│   │   ├── twinkle.js
│   │   └── odetoJoy.js
│   │
│   └── ui/
│       ├── hud.js
│       ├── cameraPanel.js
│       ├── keyDisplay.js
│       ├── nowPlayingKeys.js
│       ├── demoMenu.js
│       ├── countDown.js
│       ├── yourTurnPrompt.js
│       └── visualUpdaters.js
│
└── vendor/
    └── three/
```

---

## Running the Project

Because the project uses JavaScript ES modules, it should be served through a local HTTP server rather than opening `index.html` directly.

### Option 1 — Python

From the project directory:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2 — VS Code Live Server

Open the project folder in VS Code and run it using the **Live Server** extension.

A modern browser with WebGL and Web Audio API support is required.

---

## Technologies

* **JavaScript**
* **Three.js**
* **WebGL**
* **Web Audio API**
* **GLTF / GLB**
* **HTML / CSS**
* **ES Modules**

---

## Computer Graphics Concepts

The project applies several concepts covered in the Computer Graphics course:

* Object-space and world-space coordinates
* Geometric transformations
* Hierarchical transformations / scene graphs
* Perspective camera and view transformations
* Bounding boxes
* 3D model loading
* Polygonal mesh rendering
* Lighting and shading
* Interactive rendering
* Real-time rasterization
* Spatial interaction and geometric detection

---

## Contributors

### Ko-Chun Liao

Primary contributions:

* Built the initial 3D scene, including lighting, camera, renderer, and background configuration
* Implemented loaders for the violin, bow, and environment GLB models
* Handled model normalization, scale, position, and orientation
* Developed the first version of the bow-string contact detection algorithm
* Defined the spatial collision regions used for bow and string interaction
* Established the modular project structure
* Built the initial main rendering and interaction foundation for further development

### Pei-Huan Hsieh

Primary contributions:

* Redesigned the bow toggle interaction to make the full bow length playable
* Developed the Web Audio violin synthesis engine
* Added harmonic synthesis, body resonance, vibrato, and bow-change friction effects
* Developed the fingerboard position visualization system
* Implemented the melody player and game mode
* Improved the string layout and HUD feedback system

---

## Future Improvements

Possible future extensions include:

* Additional violin positions
* More songs and difficulty levels
* Improved violin timbre
* Enhanced tutorials and onboarding
* More advanced scoring
* Improved bowing visualization
* Additional visual effects and shaders
* Expanded gameplay modes

---

## Credits

3D models used in this project are credited in [`CREDITS.md`](./CREDITS.md).

The models include:

* **Stradivari Violin** — Ethan Savage
* **Violin Bow** — CharlotteMeehan
* **The Great Drawing Room** — The Hallwyl Museum

Please refer to `CREDITS.md` for the original model links and licensing information.

---

## Authors

**Ko-Chun Liao**
**Pei-Huan Hsieh**

University of Technology Sydney
Computer Graphics
