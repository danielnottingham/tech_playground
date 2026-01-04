import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AreasList } from './pages/AreasList';
import { AreaDetails } from './pages/AreaDetails';
import { ExploratoryAnalysis } from './pages/ExploratoryAnalysis';
import { EmployeesList } from './pages/EmployeesList';
import { EmployeeDetail } from './pages/EmployeeDetail';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/areas" element={<AreasList />} />
        <Route path="/areas/:id" element={<AreaDetails />} />
        <Route path="/eda" element={<ExploratoryAnalysis />} />
        <Route path="/employees" element={<EmployeesList />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

