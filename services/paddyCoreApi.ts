// paddyCoreApi.ts
import { PADDY_CORE_WS_URL } from "@/constants/paddyCoreConfig";

class PaddyCoreApi {
  private ws: WebSocket | null = null;
  private listeners: ((msg: any) => void)[] = [];
  private cameraStreaming = false; // desired state

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      console.log("[PADDY-WS] Already connected or connecting...");
      return;
    }

    console.log("[PADDY-WS] Connecting to:", PADDY_CORE_WS_URL);
    this.ws = new WebSocket(PADDY_CORE_WS_URL);

    this.ws.onopen = () => {
      console.log("[PADDY-WS] CONNECTED");
      this.sendRaw({ type: "controller_connected" });

      // If this screen wanted streaming, start it now
      if (this.cameraStreaming) {
        console.log("[PADDY-WS] Camera streaming requested → sending START");
        this.sendRaw({ type: "camera", cmd: "START" });
      }
    };

    this.ws.onmessage = (event) => {
      let data: any = null;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }

      // Don't log if it's image data (binary or base64)
      if (this.isImageData(data)) {
        // Silently pass image data to listeners without logging
        this.listeners.forEach((cb) => cb(data));
      } else {
        console.log("[PADDY-WS] Message:", data);
        this.listeners.forEach((cb) => cb(data));
      }
    };

    this.ws.onerror = (err) => {
      console.log("[PADDY-WS] ERROR:", err);
    };

    this.ws.onclose = () => {
      console.log("[PADDY-WS] DISCONNECTED — retrying in 1.5s...");
      this.ws = null;
      setTimeout(() => this.connect(), 1500);
    };
  }

  private isImageData(data: any): boolean {
    // Check if data is binary (ArrayBuffer, Blob, etc.)
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      return true;
    }

    // Check if data is a string that might be base64 image data
    if (typeof data === "string") {
      // Common patterns for image data in messages
      return (
        data.startsWith("data:image/") ||
        data.includes("image") ||
        data.length > 1000
      ); // Long strings likely contain image data
    }

    // Check if data is an object with image-related properties
    if (typeof data === "object" && data !== null) {
      return (
        data.type === "image" ||
        data.image !== undefined ||
        data.frame !== undefined ||
        data.data !== undefined
      );
    }

    return false;
  }

  close() {
    if (this.ws) {
      console.log("[PADDY-WS] Closing connection");
      this.ws.close();
      this.ws = null;
    }
  }

  addListener(cb: (msg: any) => void) {
    this.listeners.push(cb);
  }

  removeListener(cb: (msg: any) => void) {
    this.listeners = this.listeners.filter((fn) => fn !== cb);
  }

  private sendRaw(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("[PADDY-WS] Cannot send, WS not open:", payload);
      return;
    }
    console.log("[PADDY-WS] SEND:", payload);
    this.ws.send(JSON.stringify(payload));
  }

  private ensureConnected() {
    if (
      !this.ws ||
      this.ws.readyState === WebSocket.CLOSING ||
      this.ws.readyState === WebSocket.CLOSED
    ) {
      this.connect();
    }
  }

  private send(payload: any) {
    this.ensureConnected();
    this.sendRaw(payload);
  }

  // ===== MOVEMENT =====
  sendMoveForward() {
    this.send({ type: "move", cmd: "FORWARD" });
  }
  sendMoveBackward() {
    this.send({ type: "move", cmd: "BACKWARD" });
  }
  sendMoveLeft() {
    this.send({ type: "move", cmd: "LEFT" });
  }
  sendMoveRight() {
    this.send({ type: "move", cmd: "RIGHT" });
  }
  sendStop() {
    this.send({ type: "move", cmd: "STOP" });
  }

  // ===== HORN =====
  sendHorn() {
    this.send({ type: "horn" });
  }

  // ===== RICE DOOR =====
  sendDoorOpen() {
    this.send({ type: "door", action: "OPEN" });
  }
  sendDoorClose() {
    this.send({ type: "door", action: "CLOSE" });
  }

  // ===== SCOOP =====
  sendScoopUp() {
    this.send({ type: "scoop", cmd: "UP" });
  }
  sendScoopDown() {
    this.send({ type: "scoop", cmd: "DOWN" });
  }

  // ===== CAMERA =====
  sendCameraLeft() {
    this.send({ type: "camera", cmd: "LEFT" });
  }
  sendCameraRight() {
    this.send({ type: "camera", cmd: "RIGHT" });
  }

  // Called by screen when it wants live stream
  sendCameraStart() {
    this.cameraStreaming = true;
    this.ensureConnected();

    // If already open, send immediately; if not, onopen will send
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRaw({ type: "camera", cmd: "START" });
    }
  }

  sendCameraStop() {
    this.cameraStreaming = false;
    this.send({ type: "camera", cmd: "STOP" });
  }

  sendHornTimerSet(minutes: number) {
    this.send({
      type: "horn_timer_set",
      minutes,
    });
  }

  sendHornTimerClear() {
    this.send({
      type: "horn_timer_clear",
    });
  }
}

export default new PaddyCoreApi();
