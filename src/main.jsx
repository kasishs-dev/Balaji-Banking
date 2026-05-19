import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import theme from './theme.js'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
