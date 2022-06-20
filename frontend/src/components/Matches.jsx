import React, { useState, useCallback, useEffect } from "react";
import { getMatches } from "../data/repository";

export default function Matches(props) {
  const { matches, setMatches, selectedSeason, selectedRound } = props;

  const [loading, setLoading] = useState(true);

  const fetchMatchesCallback = useCallback(
    async (season, round) => {
      const response = await getMatches(season, round);

      setMatches(response.data);
      setLoading(false);
    },
    [setMatches, setLoading]
  );

  useEffect(() => {
    setLoading(true);
    // ! This seems wrong, could be because of react strict mode
    if (selectedSeason && selectedRound) {
      fetchMatchesCallback(selectedSeason, selectedRound);
    }
  }, [fetchMatchesCallback, selectedSeason, selectedRound]);

  const handleChangeTip = (i, selection) => {
    const tmpMatches = [...matches];
    tmpMatches[i].selected = selection;
    setMatches(tmpMatches);
  };

  const handleClickClear = () => {
    setMatches(matches.map(x => ({ ...x, selected: null })));
  };

  const handleClickRandom = () => {
    const choices = ["home", "away"];

    setMatches(
      matches.map(x => ({
        ...x,
        selected: choices[Math.floor(choices.length * Math.random())],
      }))
    );
  };

  return (
    <div className="card mt-3 mx-3">
      <div className="card-header">Matches</div>
      <div className="card-body">
        {loading ? (
          <div className="d-none d-xl-flex justify-content-center">
            <div className="spinner-border my-5" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {matches?.map((match, i) => (
              <div key={i} className="d-flex align-items-center mb-2">
                <input
                  type="radio"
                  className="btn-check"
                  name={`match${i}`}
                  id={`home${i}`}
                  onChange={() => handleChangeTip(i, "home")}
                  checked={matches[i].selected === "home"}
                />
                <label className="btn btn-outline-primary" htmlFor={`home${i}`}>
                  {match.home_team}
                  {match.home_points && (
                    <span className="badge bg-secondary ms-2">
                      {match.home_points}
                    </span>
                  )}
                </label>
                <span className="mx-2">vs</span>
                <input
                  type="radio"
                  className="btn-check"
                  name={`match${i}`}
                  id={`away${i}`}
                  onChange={() => handleChangeTip(i, "away")}
                  checked={matches[i].selected === "away"}
                />
                <label
                  className="btn btn-outline-primary me-2"
                  htmlFor={`away${i}`}>
                  {match.away_team}
                  {match.away_points && (
                    <span className="badge bg-secondary ms-2">
                      {match.away_points}
                    </span>
                  )}
                </label>
                <span className="badge bg-secondary">@ {match.ground}</span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="card-footer d-flex justify-content-between">
        <div>
          <div
            className="btn-group"
            role="group"
            aria-label="Button group with nested dropdown">
            <button type="button" className="btn btn-primary" disabled>
              Odds
            </button>

            <div className="btn-group" role="group">
              <button
                id="btnGroupDrop1"
                type="button"
                className="btn btn-primary dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                disabled></button>
              <ul className="dropdown-menu" aria-labelledby="btnGroupDrop1">
                <li>
                  <a className="dropdown-item" href="#">
                    Odds Provider
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <button className="btn btn-primary ms-2" onClick={handleClickRandom}>
            Random
          </button>
        </div>
        <div>
          <button className="btn btn-danger" onClick={handleClickClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
