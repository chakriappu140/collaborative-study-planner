import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { FaEraser, FaTrash, FaPenFancy } from "react-icons/fa";

const Whiteboard = ({ groupId }) => {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socket = useSocket();

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#0099ff");
  const [isErasing, setIsErasing] = useState(false);
  const prevPointRef = useRef(null);

  // Now track positions for visible pens
  const [activePens, setActivePens] = useState({}); // { socketId: { x, y, color, name } }

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth - 32;
      canvas.height = container.offsetHeight - 32;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;

    // Drawing broadcast listener
    if (socket) {
      socket.on("drawing", (data) => {
        const { x0, y0, x1, y1, color: drawColor, isErasing: erasing } = data;
        const remoteContext = canvas.getContext("2d");
        const prevColor = remoteContext.strokeStyle;
        const prevLineWidth = remoteContext.lineWidth;
        remoteContext.strokeStyle = erasing ? "#ffffff" : drawColor;
        remoteContext.lineWidth = erasing ? 15 : 5;
        remoteContext.beginPath();
        remoteContext.moveTo(x0, y0);
        remoteContext.lineTo(x1, y1);
        remoteContext.stroke();
        remoteContext.strokeStyle = prevColor;
        remoteContext.lineWidth = prevLineWidth;
      });

      // Track active pens on "drawing_active" and "drawing_inactive"
      socket.on("drawing_active", ({ x, y, color, userName, socketId }) => {
        setActivePens((prev) => ({
          ...prev,
          [socketId]: { x, y, color, userName }
        }));
      });
      socket.on("drawing_inactive", ({ socketId }) => {
        setActivePens((prev) => {
          const copy = { ...prev };
          delete copy[socketId];
          return copy;
        });
      });
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socket) {
        socket.off("drawing");
        socket.off("drawing_active");
        socket.off("drawing_inactive");
      }
    };
  }, [socket]);

  // When drawing, emit active position with color and name
  const sendDrawingActive = (coords) => {
    if (socket) {
      socket.emit("drawing_active", {
        groupId,
        x: coords.x,
        y: coords.y,
        color,
        userName: user.name || "Unknown"
      });
    }
  };

  const sendDrawingInactive = () => {
    if (socket) {
      socket.emit("drawing_inactive", {
        groupId
      });
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    prevPointRef.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
    sendDrawingActive({ x: offsetX, y: offsetY });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const prev = prevPointRef.current;
    if (prev) {
      contextRef.current.strokeStyle = isErasing ? "#ffffff" : color;
      contextRef.current.lineWidth = isErasing ? 15 : 5;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      if (socket) {
        socket.emit("drawing", {
          x0: prev.x,
          y0: prev.y,
          x1: offsetX,
          y1: offsetY,
          color,
          isErasing,
          groupId
        });
        sendDrawingActive({ x: offsetX, y: offsetY });
      }
      prevPointRef.current = { x: offsetX, y: offsetY };
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    prevPointRef.current = null;
    setIsDrawing(false);
    sendDrawingInactive();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleColorChange = newColor => {
    setColor(newColor);
    setIsErasing(false);
    if (contextRef.current) {
      contextRef.current.strokeStyle = newColor;
      contextRef.current.lineWidth = 5;
    }
  };

  const toggleEraser = () => {
    const newErasing = !isErasing;
    setIsErasing(newErasing);
    if (contextRef.current) {
      contextRef.current.strokeStyle = newErasing ? "#ffffff" : color;
      contextRef.current.lineWidth = newErasing ? 15 : 5;
    }
  };

  // Overlay pens and names for active drawers
  const renderPens = () => (
    <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", width: "100%", height: "100%" }}>
      {Object.entries(activePens).map(([socketId, pen]) => {
        // Don't show your own pen (unless you want to, then remove this condition)
        if (socket.id === socketId) return null;
        return (
          <div key={socketId}
            style={{
              position: 'absolute',
              left: pen.x - 8,
              top: pen.y - 40, // move above the pen
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
            <span style={{
              background: '#222',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              marginBottom: 2,
              fontSize: 13,
              fontWeight: 500
            }}>{pen.userName || "Unknown"}</span>
            <FaPenFancy style={{ color: pen.color, fontSize: 24, filter: "drop-shadow(0 0 3px #222)" }} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full" style={{ position: "relative" }}>
      <h2 className="text-2xl font-semibold mb-4">Collaborative Whiteboard</h2>
      <div className="flex space-x-4 mb-4">
        <input
          type="color"
          value={color}
          onChange={e => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded-full cursor-pointer border-none"
          title="Choose color"
        />
        <button
          onClick={toggleEraser}
          className={`p-2 rounded-lg transition-colors text-white ${isErasing ? "bg-red-600" : "bg-gray-700"}`}
          title={isErasing ? "Disable Eraser" : "Enable Eraser"}
          aria-pressed={isErasing}
        >
          <FaEraser />
        </button>
        <button
          onClick={clearCanvas}
          className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          title="Clear Canvas"
        >
          <FaTrash />
        </button>
      </div>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {renderPens()}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="bg-white border border-gray-700 rounded-lg w-full h-96"
        ></canvas>
      </div>
    </div>
  );
};

export default Whiteboard;
