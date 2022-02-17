import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { add } from "hydra-ts";

function App() {
  const handleClick = async () => {
    alert(`600 = ${await add(100, 500)}`);
  };
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={handleClick}>Add numbers!</button>
      </header>
    </div>
  );
}

export default App;
