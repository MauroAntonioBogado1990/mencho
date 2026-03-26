import React from 'react'
import ReactDOM from 'react-dom/client'
import AnimalesList from './pages/AnimalesList'
import './index.css' // Asegurate de crear este archivo vacío al menos
import RecordatoriosWidget from '../components/RecordatoriosWidget';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnimalesList />
  </React.StrictMode>,
  // Dentro del JSX de tu pantalla de inicio:
<RecordatoriosWidget />
)