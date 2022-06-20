import React, { useState } from "react";
import { useEffect } from "react";
import "./App.css";
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
    </>
  );
}

export default App;
