import React from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { getRounds, getSeasons } from "../data/repository";
import RoundSwitcherPagination from "./RoundSwitcherPagination";

export default function RoundSwitcher() {
  const [loading, setLoading] = useState({ seasons: true, rounds: true });
  const [seasons, setSeaons] = useState(null);
  const [rounds, setRounds] = useState(null);
  const [fields, setFields] = useState({ season: new Date().getFullYear() });
  const [selectedRound, setSelectedRound] = useState(null);

  const handleInputChange = event => {
    setFields({ ...fields, [event.target.name]: event.target.value });
  };

  const fetchSeasonsCallback = useCallback(async () => {
    const response = await getSeasons();

    setSeaons(response.data);
    setLoading(loading => {
      return { ...loading, seasons: false };
    });
  }, []);

  const fetchRoundsCallback = useCallback(async season => {
    const response = await getRounds(season);

    setRounds(response.data);
    setLoading(loading => {
      return { ...loading, rounds: false };
    });
  }, []);

  useEffect(() => {
    fetchSeasonsCallback();
  }, [fetchSeasonsCallback]);

  useEffect(() => {
    setLoading(loading => {
      return { ...loading, rounds: true };
    });
    fetchRoundsCallback(fields.season);
  }, [fetchRoundsCallback, fields.season]);

  const handleClickRound = round => {
    setSelectedRound(round);
  };

  const handleClickNavigation = direction => {
    const roundsFlatArray = Object.values(rounds).flat();
    const currentRoundIndex = roundsFlatArray.indexOf(selectedRound);

    if (
      (currentRoundIndex === 0 && direction === "prev") ||
      (currentRoundIndex === roundsFlatArray.length - 1 && direction === "next")
    ) {
      return;
    }

    setSelectedRound(
      direction === "next"
        ? roundsFlatArray[currentRoundIndex + 1]
        : roundsFlatArray[currentRoundIndex - 1]
    );
  };

  return (
    <div className="card mt-3 mx-3">
      <div
        style={{ height: 48 }}
        className="card-header d-flex justify-content-between align-items-center">
        <span>Rounds</span>
        <div style={{ width: 100 }}>
          {loading.seasons ? (
            <div className="d-flex justify-content-end align-items-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <select
              name="season"
              value={fields.season}
              onChange={handleInputChange}
              className="form-select form-select-sm">
              {seasons?.map(season => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="card-body pb-1">
        {loading.rounds ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border my-5" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <RoundSwitcherPagination
              rounds={rounds.preliminary}
              selectedRound={selectedRound}
              handleClickRound={handleClickRound}
              handleClickNavigation={handleClickNavigation}
            />
            <RoundSwitcherPagination
              rounds={rounds.homeAway}
              selectedRound={selectedRound}
              handleClickRound={handleClickRound}
              handleClickNavigation={handleClickNavigation}
            />
            <RoundSwitcherPagination
              rounds={rounds.finals}
              selectedRound={selectedRound}
              handleClickRound={handleClickRound}
              handleClickNavigation={handleClickNavigation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
