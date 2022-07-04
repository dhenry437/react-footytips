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
  const [currentRound, setCurrentRound] = useState();
  const [selectedOdds, setSelectedOdds] = useState(null);

  return (
    <>
      <ToastContainer autoClose={3000} />
      <Navbar
        setMatches={setMatches}
        selectedSeason={selectedSeason}
        selectedRound={selectedRound}
        setSelectedOdds={setSelectedOdds}
      />
      <RoundSwitcher
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
        setCurrentRound={setCurrentRound}
      />
      <Matches
        matches={matches}
        setMatches={setMatches}
        selectedSeason={selectedSeason}
        selectedRound={selectedRound}
        currentRound={currentRound}
        selectedOdds={selectedOdds}
        setSelectedOdds={setSelectedOdds}
      />
      <Email matches={matches} selectedRound={selectedRound} />
    </>
  );
}

export default App;
