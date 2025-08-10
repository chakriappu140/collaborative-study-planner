import React, { StrictMode } from 'react'
import ReactDOM from "react-dom/client"
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {SocketProvider} from "./context/SocketContext.jsx"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SocketProvider>
      <App/>
    </SocketProvider>
  </React.StrictMode>
)
