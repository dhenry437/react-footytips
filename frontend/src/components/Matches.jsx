import React, { useState, useCallback, useEffect, Fragment } from "react";
import { toast } from "react-toastify";
import { getMatches, getOdds } from "../data/repository";

export default function Matches(props) {
  const {
    matches,
    setMatches,
    selectedSeason,
    selectedRound,
    currentRound,
    selectedOdds,
    setSelectedOdds,
  } = props;

  const [loading, setLoading] = useState({ matches: true, odds: false });

  const fetchMatchesCallback = useCallback(
    async (season, round) => {
      setLoading(loading => {
        return { ...loading, matches: true };
      });

      const response = await getMatches(season, round);

      setMatches(response.data);
      setLoading(loading => {
        return { ...loading, matches: false };
      });
    },
    [setMatches, setLoading]
  );

  const fetchOddsCallback = useCallback(
    async (matches, season, round) => {
      setLoading(loading => {
        return { ...loading, odds: true };
      });
      setSelectedOdds(null);
      const response = await getOdds(matches, season, round);

      setMatches(response.data);
      setLoading({ matches: false, odds: false });
    },
    [setMatches, setLoading, setSelectedOdds]
  );

  useEffect(() => {
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

  const handleClickFavourites = () => {
    const choices = ["home", "away"];

    if (matches.some(x => !!x.odds)) {
      setMatches(
        matches.map(x => ({
          ...x,
          selected:
            x.odds?.[selectedOdds]?.home === x.odds?.[selectedOdds]?.away
              ? choices[Math.floor(choices.length * Math.random())]
              : x.odds?.[selectedOdds]?.home < x.odds?.[selectedOdds]?.away
              ? "home"
              : "away",
        }))
      );
    } else {
      toast.info("You need to fetch the odds first");
    }
  };

  const handleClickFetchOdds = () => {
    fetchOddsCallback(matches, selectedSeason, selectedRound);
  };

  const handleChangeOdds = bookmaker => {
    setSelectedOdds(bookmaker);
  };

  const oddsBadge = (homeOdds, awayOdds, reverse = false) => {
    if (!homeOdds && !awayOdds) {
      return "warning text-dark";
    }

    if (homeOdds === awayOdds) {
      return "warning text-dark";
    }

    let tmp;
    if (homeOdds > awayOdds) {
      tmp = "danger";
    } else {
      tmp = "success";
    }

    if (reverse) {
      tmp = tmp === "success" ? "danger" : "success";
    }

    return tmp;
  };

  const getBookmakersFromMatches = matches => {
    return [...new Set(matches.map(x => Object.keys(x.odds)).flat())];
  };

  return (
    <div className="card mt-3 mx-3">
      <div className="card-header">Matches</div>
      <div className="card-body">
        {loading.matches ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border my-5" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {selectedRound >= currentRound && (
              <>
                <div className="d-flex">
                  <button
                    className="btn btn-success me-2"
                    onClick={handleClickFetchOdds}>
                    Fetch Odds
                  </button>
                  {loading.odds ? (
                    <div className="d-flex justify-content-center flex-grow-1">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-start flex-grow-1 flex-wrap">
                      {matches &&
                        (matches.some(x => !!x.odds) ? (
                          getBookmakersFromMatches(matches).length > 0 ? (
                            getBookmakersFromMatches(matches).map(
                              (bookmaker, i) => (
                                <Fragment key={i}>
                                  <input
                                    type="radio"
                                    className="btn-check"
                                    name="odds"
                                    id={`odds${i}`}
                                    checked={selectedOdds === bookmaker}
                                    onChange={() => handleChangeOdds(bookmaker)}
                                  />
                                  <label
                                    className="btn btn-primary btn-sm my-1 me-1"
                                    htmlFor={`odds${i}`}>
                                    {bookmaker}
                                  </label>
                                </Fragment>
                              )
                            )
                          ) : (
                            <div className="alert alert-info mb-0 flex-grow-1 text-center p-2">
                              There are no bookmakers avaliable for this round
                            </div>
                          )
                        ) : (
                          <div className="alert alert-secondary mb-0 flex-grow-1 text-center p-2">
                            Click fetch odds to show avaliable bookmakers
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <hr />
              </>
            )}
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
                  {selectedOdds && match.odds && (
                    <span
                      className={`badge bg-${oddsBadge(
                        match.odds?.[selectedOdds]?.home,
                        match.odds?.[selectedOdds]?.away
                      )} ms-2`}>
                      {`$${match.odds[selectedOdds]?.home || "-.--"}`}
                    </span>
                  )}
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
                  {selectedOdds && match.odds && (
                    <span
                      className={`badge bg-${oddsBadge(
                        match.odds?.[selectedOdds]?.home,
                        match.odds?.[selectedOdds]?.away,
                        true
                      )} ms-2`}>
                      {`$${match.odds[selectedOdds]?.away || "-.--"}`}
                    </span>
                  )}
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClickFavourites}>
            Favourites
          </button>
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
