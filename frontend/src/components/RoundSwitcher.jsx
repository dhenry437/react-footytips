import React from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { getRounds, getSeasons } from "../data/repository";
import RoundSwitcherPagination from "./RoundSwitcherPagination";

export default function RoundSwitcher(props) {
  const { selectedSeason, setSelectedSeason, selectedRound, setSelectedRound } =
    props;

  const [loading, setLoading] = useState({ seasons: true, rounds: true });
  const [seasons, setSeaons] = useState(null);
  const [rounds, setRounds] = useState(null);

  const fetchSeasonsCallback = useCallback(async () => {
    const response = await getSeasons();

    setSeaons(response.data);
    setLoading(loading => {
      return { ...loading, seasons: false };
    });
  }, []);

  const fetchRoundsCallback = useCallback(
    async season => {
      const response = await getRounds(season);

      setRounds(response.data);
      setLoading(loading => {
        return { ...loading, rounds: false };
      });
      setSelectedRound(response.data.currentRound || "");
    },
    [setSelectedRound]
  );

  useEffect(() => {
    fetchSeasonsCallback();
  }, [fetchSeasonsCallback]);

  useEffect(() => {
    setLoading(loading => {
      return { ...loading, rounds: true };
    });
    fetchRoundsCallback(selectedSeason);
  }, [fetchRoundsCallback, selectedSeason]);

  const handleClickRound = round => {
    setSelectedRound(round);
  };

  const handleChangeSeason = season => {
    setSelectedSeason(season);
  };

  const handleClickNavigation = direction => {
    const roundsFlatArray = Object.values(
      (({ preliminary, homeAway, finals }) => ({
        preliminary,
        homeAway,
        finals,
      }))(rounds)
    ).flat();
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

  const handleClickCurrent = () => {
    setSelectedRound(rounds.currentRound || "");
  };

  const handleChangeMobileRoundSwitcher = event => {
    setSelectedRound(event.target.value);
  };

  return (
    <div className="card mt-3 mx-3">
      <div
        style={{ height: 48 }}
        className="card-header d-flex justify-content-between align-items-center">
        <span>Round</span>
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
              value={selectedSeason}
              onChange={event => handleChangeSeason(event.target.value)}
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
          <>
            <div className="d-none d-xl-flex justify-content-center">
              <div className="spinner-border my-5" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            <div className="d-flex d-xl-none justify-content-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="d-none d-xl-block">
              <RoundSwitcherPagination
                rounds={rounds.preliminary}
                selectedRound={selectedRound}
                handleClickRound={handleClickRound}
                handleClickNavigation={handleClickNavigation}
                handleClickCurrent={handleClickCurrent}
              />
              <RoundSwitcherPagination
                rounds={rounds.homeAway}
                selectedRound={selectedRound}
                handleClickRound={handleClickRound}
                handleClickNavigation={handleClickNavigation}
                handleClickCurrent={handleClickCurrent}
              />
              <RoundSwitcherPagination
                rounds={rounds.finals}
                selectedRound={selectedRound}
                handleClickRound={handleClickRound}
                handleClickNavigation={handleClickNavigation}
                handleClickCurrent={handleClickCurrent}
              />
            </div>
            <div className="d-block d-xl-none">
              <select
                name="selectedRound"
                value={selectedRound}
                onChange={handleChangeMobileRoundSwitcher}
                className="form-select mb-3">
                {Object.values(
                  (({ preliminary, homeAway, finals }) => ({
                    preliminary,
                    homeAway,
                    finals,
                  }))(rounds)
                )
                  .flat()
                  .map(round => {
                    return (
                      <option key={round} value={round}>
                        {round}
                      </option>
                    );
                  })}
              </select>
            </div>
            <button
              className="btn btn-primary mb-2"
              onClick={handleClickCurrent}
              disabled={
                !rounds.currentRound || selectedRound === rounds.currentRound
              }>
              Current Round
            </button>
          </>
        )}
      </div>
    </div>
  );
}
