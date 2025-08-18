import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPaintBrush, FaEraser, FaTrash } from 'react-icons/fa';

const Whiteboard = ({ groupId }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const socket = useSocket();

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [isErasing, setIsErasing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        
        // Make canvas responsive
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            canvas.width = container.offsetWidth - 32; // Account for padding
            canvas.height = container.offsetHeight - 32;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = isErasing ? 15 : 5;
        contextRef.current = context;

        if (socket) {
            socket.on('drawing', (data) => {
                const { x0, y0, x1, y1, color, isErasing } = data;
                const remoteContext = canvas.getContext('2d');
                remoteContext.strokeStyle = isErasing ? '#ffffff' : color;
                remoteContext.lineWidth = isErasing ? 15 : 5;
                remoteContext.beginPath();
                remoteContext.moveTo(x0, y0);
                remoteContext.lineTo(x1, y1);
                remoteContext.stroke();
            });
        }
        
        // Cleanup function for the socket listener and event listener
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (socket) {
                socket.off('drawing');
            }
        };
    }, [socket, color, isErasing]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x0 = nativeEvent.clientX - rect.left;
        const y0 = nativeEvent.clientY - rect.top;
        
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
        
        if (socket) {
            socket.emit('drawing', {
                x0: x0,
                y0: y0,
                x1: offsetX,
                y1: offsetY,
                color: color,
                isErasing: isErasing,
                groupId: groupId,
            });
        }
    };

    const stopDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleColorChange = (newColor) => {
        setColor(newColor);
        setIsErasing(false);
        contextRef.current.strokeStyle = newColor;
        contextRef.current.lineWidth = 5;
    };

    const toggleEraser = () => {
        setIsErasing(!isErasing);
        contextRef.current.strokeStyle = isErasing ? '#ffffff' : color;
        contextRef.current.lineWidth = isErasing ? 15 : 5;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
            <h2 className="text-2xl font-semibold mb-4">Collaborative Whiteboard</h2>
            <div className="flex space-x-4 mb-4">
                <div className="flex space-x-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-none"
                    />
                    <button
                        onClick={toggleEraser}
                        className={`p-2 rounded-lg ${isErasing ? 'bg-red-600' : 'bg-gray-700'} text-white transition-colors`}
                    >
                        <FaEraser />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    >
                        <FaTrash />
                    </button>
                </div>
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
