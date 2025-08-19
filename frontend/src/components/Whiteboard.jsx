import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import { FaEraser, FaTrash } from "react-icons/fa";

const Whiteboard = ({ groupId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socket = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [isErasing, setIsErasing] = useState(false);
  const prevPointRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth - 32;
      canvas.height = container.offsetHeight - 32;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize canvas context once
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = isErasing ? 15 : 5;
    contextRef.current = context;

    // Listen to drawing events from others via socket
    if (socket) {
      socket.on("drawing", (data) => {
        const { x0, y0, x1, y1, color: drawColor, isErasing: erasing } = data;
        const remoteContext = canvas.getContext("2d");
        // Save previous context state
        const prevColor = remoteContext.strokeStyle;
        const prevLineWidth = remoteContext.lineWidth;

        remoteContext.strokeStyle = erasing ? "#ffffff" : drawColor;
        remoteContext.lineWidth = erasing ? 15 : 5;

        // Always draw line between two points:
        remoteContext.beginPath();
        remoteContext.moveTo(x0, y0);
        remoteContext.lineTo(x1, y1);
        remoteContext.stroke();

        // Restore
        remoteContext.strokeStyle = prevColor;
        remoteContext.lineWidth = prevLineWidth;
      });
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socket) socket.off("drawing");
    };
  }, [socket]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    prevPointRef.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const prev = prevPointRef.current;
    if (prev) {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      if (socket) {
        socket.emit("drawing", {
          x0: prev.x, y0: prev.y, x1: offsetX, y1: offsetY,
          color, isErasing, groupId
        });
      }
      prevPointRef.current = { x: offsetX, y: offsetY };
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    prevPointRef.current = null;
    setIsDrawing(false);
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

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
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
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        className="bg-white border border-gray-700 rounded-lg w-full h-96"
      ></canvas>
    </div>
  );
};

export default Whiteboard;
