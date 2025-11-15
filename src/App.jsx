import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Signup from "./Auth/Signup";
import Login from './Auth/Login';
import Report from './components/Report';

export default function App() {
  return (
    <Router>

      {/* Pages that SHOULD have Navbar */}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Hero />
            </>
          }
        />
        <Route
          path="/report"
          element={
            <>
              <Report />
            </>
          }
        />
      </Routes>

      {/* Pages WITHOUT Navbar */}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>

    </Router>
  );
}
