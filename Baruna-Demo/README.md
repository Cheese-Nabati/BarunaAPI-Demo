# Baruna Attendance System - Demonstration

This is a demonstration repository for the **Baruna Attendance System**. It showcases the core functionality of the RFID-based attendance system using Fastify and SQLite.

## Features
- **Dashboard**: Real-time attendance log monitoring.
- **Virtual Scanner**: Built-in web button to simulate hardware scanning.
- **ESP32 Support**: Fully compatible with the official firmware.

## Quick Start
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open `http://localhost:3000` in your browser.

## Hardware Connection (ESP32)
To connect your ESP32 to this demo:
1. Ensure your ESP32 and this server are on the **same Wi-Fi network**.
2. Find your computer's local IP address (e.g., `192.168.1.10`).
3. Update the `baseUrl` in your ESP32 firmware to `http://192.168.1.10:3000`.
4. Use the `deviceToken`: `DEMO_SECURE_TOKEN_2026`.

## License
MIT
