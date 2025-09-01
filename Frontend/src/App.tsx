import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Component/SignUp";
import Signin from "./Component/SignIn";
import Dashboard from "./Component/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route = Signup */}
        <Route path="/" element={<Signup/> } />
        <Route path="/signin" element={<Signin />} />
        <Route path="/dashboard" element={<Dashboard/>} />

        {/* Redirect unknown routes to Signup */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
