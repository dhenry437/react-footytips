import React, { useState, useCallback, useEffect, Fragment } from "react";
import { toast } from "react-toastify";
import { getMatches, getOdds } from "../data/repository";
import dayjs from "dayjs";

export default function Matches(props) {
  const {
    matches,
    setMatches,
    selectedSeason,
    selectedRound,
    selectedOdds,
    setSelectedOdds,
  } = props;

  const [loading, setLoading] = useState({ matches: true, odds: false });
  const [error, setError] = useState({ matches: null, odds: null });

  const fetchMatchesCallback = useCallback(
    async (season, round) => {
      setLoading(loading => {
        return { ...loading, matches: true };
      });

      const response = await getMatches(season, round);
      if (response.status !== 200) {
        setLoading(loading => ({ ...loading, matches: false }));
        setError(error => ({
          ...error,
          matches: response.data || {
            type: "danger",
            message: "Error fetching matches",
          },
        }));
        return;
      }

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
    } else {
      setError(error => ({
        ...error,
        matches: { type: "secondary", message: "No selection" },
      }));
      setLoading(loading => ({ ...loading, matches: false }));
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
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error.matches && !matches ? (
          <div className={`alert alert-${error.matches.type} mb-0`}>
            {error.matches.message}
          </div>
        ) : (
          <>
            {/* Show odds widget for rounds with a match in the future (or 6 hours in the past) */}
            {matches.length !== 0 &&
              dayjs() <=
                dayjs
                  .unix(
                    matches.reduce((a, b) => (a.unixtime > b.unixtime ? a : b))
                      .unixtime
                  )
                  .add(6, "h") && (
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
                                      onChange={() =>
                                        handleChangeOdds(bookmaker)
                                      }
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
                                There are no bookmakers available for this round
                              </div>
                            )
                          ) : (
                            <div className="alert alert-secondary mb-0 flex-grow-1 text-center p-2">
                              Click fetch odds to show available bookmakers
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <hr />
                </>
              )}
            {matches?.map((match, i) => {
              const {
                hteam,
                ateam,
                hscore,
                ascore,
                venue,
                unixtime,
                percentComplete,
                odds,
              } = match;
              const unixtimeDayjs = dayjs.unix(unixtime);

              return (
                <>
                  <div
                    key={i}
                    className="d-flex align-items-center mb-1 mb-sm-2">
                    <input
                      type="radio"
                      className="btn-check"
                      name={`match${i}`}
                      id={`home${i}`}
                      onChange={() => handleChangeTip(i, "home")}
                      checked={matches[i].selected === "home"}
                    />
                    <label
                      className="btn btn-outline-primary"
                      htmlFor={`home${i}`}>
                      {hteam || "TBD"}
                      {selectedOdds && odds && odds[selectedOdds] && (
                        <span
                          className={`badge bg-${oddsBadge(
                            odds?.[selectedOdds]?.home,
                            odds?.[selectedOdds]?.away
                          )} ms-2`}>
                          {`$${odds[selectedOdds]?.home || "-.--"}`}
                        </span>
                      )}
                      {percentComplete ? (
                        <span className="badge bg-secondary ms-2">
                          {hscore}
                        </span>
                      ) : (
                        <></>
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
                      {ateam || "TBD"}
                      {selectedOdds && odds && odds[selectedOdds] && (
                        <span
                          className={`badge bg-${oddsBadge(
                            odds?.[selectedOdds]?.home,
                            odds?.[selectedOdds]?.away,
                            true
                          )} ms-2`}>
                          {`$${odds[selectedOdds]?.away || "-.--"}`}
                        </span>
                      )}

                      {percentComplete ? (
                        <span className="badge bg-secondary ms-2">
                          {ascore}
                        </span>
                      ) : (
                        <></>
                      )}
                    </label>
                    <div className="d-none d-sm-flex badge-group">
                      <div className="badge-row">
                        <span className="badge bg-secondary">
                          {venue ? venue : "TBC"}
                        </span>
                        <span className="badge bg-info">
                          {unixtimeDayjs.format("ddd")}
                        </span>
                      </div>
                      <div className="badge-row">
                        <span className="badge bg-success">
                          {unixtimeDayjs.format("D/M")}
                        </span>
                        <span className="badge bg-warning">
                          {unixtimeDayjs.format("h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex d-sm-none flex-wrap mb-1">
                    <span className="badge bg-secondary me-2 mb-1">
                      {venue ? venue : "TBC"}
                    </span>
                    <span className="badge bg-info me-2 mb-1">
                      {unixtimeDayjs.format("ddd")}
                    </span>
                    <span className="badge bg-success me-2 mb-1">
                      {unixtimeDayjs.format("D/M/YY")}
                    </span>
                    <span className="badge bg-warning mb-1">
                      {unixtimeDayjs.format("h:mm a")}
                    </span>
                  </div>
                </>
              );
            })}
          </>
        )}
      </div>
      <div className="card-footer d-flex justify-content-between">
        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!matches || matches.length === 0}
            onClick={handleClickFavourites}>
            Favourites
          </button>
          <button
            className="btn btn-primary ms-2"
            disabled={!matches || matches.length === 0}
            onClick={handleClickRandom}>
            Random
          </button>
        </div>
        <div>
          <button
            className="btn btn-danger"
            disabled={!matches || matches.length === 0}
            onClick={handleClickClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
