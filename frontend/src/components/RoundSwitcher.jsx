import React, { useEffect, useCallback, useState } from "react";
import refreshData, { getRounds, getSeasons } from "../data/repository";
import RoundSwitcherPagination from "./RoundSwitcherPagination";
import { toast } from "react-toastify";

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
  const [error, setError] = useState({ seasons: null, rounds: null });

  const fetchSeasonsCallback = useCallback(async () => {
    const response = await getSeasons();

    if (response.status !== 200) {
      setLoading(loading => ({ ...loading, seasons: false }));
      setError(error => ({ ...error, seasons: response.data }));
      return;
    }

    setSeasons(response.data);
    setLoading(loading => {
      return { ...loading, seasons: false };
    });
  }, []);

  const fetchRoundsCallback = useCallback(
    async year => {
      const getRoundsResponse = await getRounds(year);
      if (getRoundsResponse.status !== 200) {
        setLoading(loading => ({ ...loading, rounds: false }));
        setError(error => ({
          ...error,
          rounds: getRoundsResponse.data || {
            type: "danger",
            message: "Error fetching rounds",
          },
        }));
        return;
      }
      const { homeAway, finals, currentRound } = getRoundsResponse.data;

      // currentRound must be a string
      // res.json is automatically casting it as an int
      setRounds({
        ...getRoundsResponse.data,
        currentRound: currentRound?.toString(),
      });
      setLoading(loading => {
        return { ...loading, rounds: false };
      });
      setSelectedRound(
        currentRound?.toString() ||
          [...homeAway, ...finals].map(x => x.toString())[0]
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

  const handleChangeSeason = year => {
    setSelectedSeason(year);
  };

  const handleClickNavigation = direction => {
    const roundsFlatArray = Object.values(
      (({ homeAway, finals }) => ({
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
            <div className="d-flex justify-content-end align-items-center my-1">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error.seasons || !seasons ? (
            <div className="d-flex justify-content-end align-items-center my-1">
              <i className="bi bi-exclamation-circle"></i>
            </div>
          ) : (
            <select
              name="year"
              value={selectedSeason}
              onChange={event => handleChangeSeason(event.target.value)}
              className="form-select form-select-sm">
              {seasons?.map(year => (
                <option key={year} value={year}>
                  {year}
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
        ) : error.rounds || !rounds ? (
          <div className={`alert alert-${error.rounds?.type || "danger"} mb-0`}>
            {error.rounds?.message || "Error fetching rounds"}
          </div>
        ) : (
          <>
            <div className="d-none d-xl-block">
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
                  .map((round, i) => (
                    <option key={i} value={round}>
                      {round}
                    </option>
                  ))}
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
