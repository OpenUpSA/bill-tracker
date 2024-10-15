import "./index.scss";

import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";

export default function SortedColumn(props) {
  const { sortThisfield, setSort, sortedField, heading, sortedDirection } =
    props;
  return (
    <>
      <th className="sortable" onClick={() => setSort(sortThisfield)}>
        <span>{heading}</span>
        {sortedField === sortThisfield && (
          <FontAwesomeIcon
            icon={sortedDirection === "desc" ? faCaretDown : faCaretUp}
          />
        )}
      </th>
    </>
  );
}
