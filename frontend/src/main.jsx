import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './tailwind.css'; // Change this import to the new CSS file
import { SocketProvider } from './context/SocketContext.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>
);
