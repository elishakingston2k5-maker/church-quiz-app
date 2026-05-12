import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Participant/Home';
import QuizTaker from './components/Participant/QuizTaker';
import SiteAccess from './components/Participant/SiteAccess';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';
import QuizEditor from './components/Admin/QuizEditor';
import Results from './components/Admin/Results';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

const SiteProtectedRoute = ({ children }) => {
  const hasAccess = localStorage.getItem('siteAccess');
  if (!hasAccess) {
    return <Navigate to="/access" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Routes>
          {/* Site Access Route */}
          <Route path="/access" element={<SiteAccess />} />

          {/* Participant Routes */}
          <Route path="/" element={
            <SiteProtectedRoute>
              <Home />
            </SiteProtectedRoute>
          } />
          <Route path="/quiz/:id" element={
            <SiteProtectedRoute>
              <QuizTaker />
            </SiteProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/quiz/new" element={
            <ProtectedRoute>
              <QuizEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/quiz/:id/edit" element={
            <ProtectedRoute>
              <QuizEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/quiz/:id/results" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
