import React, { useEffect, useCallback, useState } from "react";
import { getRounds, getSeasons } from "../data/repository";
import RoundSwitcherPagination from "./RoundSwitcherPagination";

export default function RoundSwitcher(props) {
  const {
    selectedSeason,
    setSelectedSeason,
    selectedRound,
    setSelectedRound,
    setCurrentRound,
  } = props;

  const [loading, setLoading] = useState({ seasons: true, rounds: true });
  const [seasons, setSeasons] = useState(null);
  const [rounds, setRounds] = useState(null);

  const fetchSeasonsCallback = useCallback(async () => {
    const response = await getSeasons();

    setSeasons(response.data);
    setLoading(loading => {
      return { ...loading, seasons: false };
    });
  }, []);

  const fetchRoundsCallback = useCallback(
    async season => {
      const response = await getRounds(season);
      const { preliminary, homeAway, finals, currentRound } = response.data;

      // currentRound must be a string
      // res.json is automatically casting it as an int
      setRounds({
        ...response.data,
        currentRound: currentRound?.toString(),
      });
      setLoading(loading => {
        return { ...loading, rounds: false };
      });
      setSelectedRound(
        currentRound?.toString() ||
          [...preliminary, ...homeAway, ...finals].map(x => x.toString())[0]
      );
      setCurrentRound(currentRound?.toString());
    },
    [setSelectedRound, setCurrentRound]
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
    )
      .flat()
      .map(x => x.toString());
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
            <div className="d-flex justify-content-end align-items-center mb-2">
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
      <div className="card-body">
        {loading.rounds ? (
          <>
            <div className="d-none d-xl-flex justify-content-center">
              <div className="spinner-border my-5" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            <div className="d-flex d-xl-none justify-content-center py-5">
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
