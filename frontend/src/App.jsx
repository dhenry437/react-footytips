import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "./App.css";
import Email from "./components/Email";
import Matches from "./components/Matches";
import Navbar from "./components/Navbar";
import RoundSwitcher from "./components/RoundSwitcher";

function App() {
  const [selectedSeason, setSelectedSeason] = useState(
    new Date().getFullYear()
  );
  const [selectedRound, setSelectedRound] = useState(null);
  const [matches, setMatches] = useState(null);

  return (
    <>
      <ToastContainer autoClose={3000} />
      <Navbar />
      <RoundSwitcher
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
      />
      <Matches
        matches={matches}
        setMatches={setMatches}
        selectedSeason={selectedSeason}
        selectedRound={selectedRound}
      />
      <Email matches={matches} selectedRound={selectedRound} />
    </>
  );
}

export default App;
