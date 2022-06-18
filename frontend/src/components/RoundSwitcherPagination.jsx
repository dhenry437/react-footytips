import React from "react";

export default function RoundSwitcherPagination(props) {
  const {
    rounds,
    selectedRound,
    handleClickRound,
    handleClickNavigation,
    // handleClickCurrent,
  } = props;

  return (
    <>
      {rounds.length > 0 && (
        <ul className="pagination">
          <li
            className="page-item"
            onClick={() => handleClickNavigation("prev")}>
            <a className="page-link nostyle" href="/#">
              Previous
            </a>
          </li>
          {rounds.map(round => (
            <li
              key={`xl${round}`}
              className={`page-item${selectedRound === round ? " active" : ""}`}
              onClick={() => handleClickRound(round)}>
              <a className="page-link nostyle" href="/#">
                {round}
              </a>
            </li>
          ))}
          <li
            className="page-item"
            onClick={() => handleClickNavigation("next")}>
            <a className="page-link nostyle" href="/#">
              Next
            </a>
          </li>
          {/* <li className="page-item" onClick={handleClickCurrent}>
            <a className="page-link" href="/#">
              Current
            </a>
          </li> */}
        </ul>
      )}
    </>
  );
}
