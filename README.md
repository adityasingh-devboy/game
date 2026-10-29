# 🥊 Street Clash: Online 2-Player & Wireless Touch Console

A real-time multiplayer 2D fighting game with **dedicated wireless smartphone touch controllers**, **room creation**, and **shareable links / QR codes**, inspired by the classic *Street Fighter IV* (Ken vs. Ryu).

---

## 🌟 New Features

### 1. ⚔️ Online 2-Player Game Rooms ("Create Room & Share Link")
- **Host a Match**:
  1. Click **"🌐 Online 2P & Remote Console"** or **"⚔️ Create 2P Online Room"**.
  2. A unique Room Code (e.g. `CLASH-789`) is automatically generated.
  3. Click **"📋 Copy Link"** to copy the join link (e.g. `http://<your-ip>:3000/?room=CLASH-789`).
  4. Send the link to a friend or have them scan the **QR Code** with their phone camera!
- **Join a Match**:
  - Open the shared link directly, or click **Join Match** and paste the room code.
  - Player 2 automatically connects and takes control of **Ryu** in real time!

---

### 2. 📱 Wireless Touch Remote Console (Turn Your Phone into a Gamepad!)
Play like an **AirConsole / Nintendo Switch** experience — watch the big screen on your PC/TV while holding your phone as a wireless arcade controller!

- **How to Connect Phone Controller**:
  1. Open the room modal and click the **"Phone Controller"** tab.
  2. Scan the **Player 1** or **Player 2** QR Code with your smartphone.
  3. Your phone instantly turns into a dedicated, low-latency arcade fight pad with:
     - **8-Way Circular Thumbstick / D-Pad** on the left.
     - **6 Arcade Push Buttons** on the right:
       - `LP` (Light Punch) & `HP` (Heavy Punch)
       - `LK` (Light Kick) & `HK` (Heavy Kick)
       - `SP` (Hadouken Fireball 🔥)
       - `ULT` (Ultra Dragon Combo 🐉)
     - **Shield Button**: Hold center `GUARD` to block.
     - **Tactile Haptic Vibration**: Vibrates on button taps and rumbles dynamically when taking hits!
     - **Live Synced Health Bar**: Your fighter's health and EX meter are displayed on your phone in real time!

---

## 🚀 Running on Local Wi-Fi (For Smartphone Gamepads & Friends)

To allow phones and other computers on your home Wi-Fi network to connect:

```bash
node server.js
```

The terminal will display your exact network URL:
```
========================================================
  🥋 STREET CLASH MULTIPLAYER & TOUCH CONSOLE SERVER
========================================================
  💻 Desktop Browser:         http://localhost:3000
  📱 Mobile Phone Controller: http://192.168.1.67:3000
========================================================
```

Open `http://localhost:3000` on your PC, then scan the QR code with your phone to start playing!

---

## 🕹️ Controls Overview

### Keyboard (Player 1 - Ken):
- **Walk Left / Right**: <kbd>A</kbd> / <kbd>D</kbd> (Walking backward blocks attacks)
- **Jump**: <kbd>W</kbd>
- **Crouch / Low Guard**: <kbd>S</kbd>
- **Light Punch (LP)**: <kbd>J</kbd>
- **Heavy Punch (HP)**: <kbd>K</kbd>
- **Light Kick (LK)**: <kbd>U</kbd>
- **Heavy Kick (HK)**: <kbd>I</kbd>
- **Hadouken (Fireball)**: <kbd>O</kbd>
- **Shoryuken (Dragon Uppercut)**: <kbd>W</kbd> + <kbd>J</kbd>
- **Ultra Combo**: <kbd>Space</kbd> *(at 100% EX Meter)*

### Keyboard (Player 2 - Ryu):
- **Movement**: <kbd>Arrow Keys</kbd> (<kbd>◄</kbd>, <kbd>►</kbd>, <kbd>▲</kbd>, <kbd>▼</kbd>)
- **Attacks**: <kbd>Numpad 1</kbd> (LP), <kbd>2</kbd> (HP), <kbd>4</kbd> (LK), <kbd>5</kbd> (HK), <kbd>0</kbd> (Hadouken)

---

## 🧩 PolyFit (Block Fitting Puzzle)
Use the top switcher tab to toggle between **Street Clash** and **PolyFit** anytime!
