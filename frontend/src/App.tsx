import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AreasList } from './pages/AreasList';
import { AreaDetails } from './pages/AreaDetails';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/areas" element={<AreasList />} />
        <Route path="/areas/:id" element={<AreaDetails />} />
      </Routes>
    </Router>
  );
}

export default App;

