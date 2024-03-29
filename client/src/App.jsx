import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import './App.css';

const App = () => (
  <Router>
    <Fragment>
      <Navbar />
      {/* <section className="container"> */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="Register" element={<Register />} />
        <Route path="Login" element={<Login />} />
      </Routes>
      {/* </section> */}
    </Fragment>
  </Router>
);
export default App;
