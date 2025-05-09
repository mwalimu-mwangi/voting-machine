import { useState, useEffect, useCallback } from "react";

type WebSocketMessage = {
  type: string;
  data: any;
};

type WebSocketHookOptions = {
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
};

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    autoConnect = true,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Create and setup WebSocket connection
  const connect = useCallback(() => {
    try {
      // Use appropriate WebSocket protocol based on page protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = (event) => {
        setIsConnected(true);
        setReconnectAttempts(0);
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (onMessage) onMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        if (onError) onError(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (onClose) onClose(event);

        // Auto reconnect logic
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }, [
    onOpen,
    onMessage,
    onError,
    onClose,
    autoReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectInterval
  ]);

  // Send message function
  const sendMessage = useCallback(
    (type: string, data: any = {}) => {
      if (socket && isConnected) {
        const message = JSON.stringify({ type, data });
        socket.send(message);
      } else {
        console.warn("Cannot send message: WebSocket is not connected");
      }
    },
    [socket, isConnected]
  );

  // Identify client type (admin/student)
  const identify = useCallback(
    (role: "admin" | "student" | "unknown" = "unknown") => {
      sendMessage("identify", { role });
    },
    [sendMessage]
  );

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [autoConnect, connect, socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    identify,
    connect,
    reconnectAttempts
  };
}