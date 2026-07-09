import React, { Fragment, useEffect, useState, useMemo } from "react";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";
import "../overview/style.scss";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExternalLinkAlt,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faTriangleExclamation,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { Scrollbars } from "react-custom-scrollbars";
import Papa from "papaparse";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 75;

const PMG_BASE = "https://pmg.org.za/committee-question/";

const TYPE_LABELS = {
  written: "Written",
  oral: "Oral",
  president: "President",
  deputy_president: "Deputy President",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str || typeof str !== "string") return null;
  // Handles "Thursday, February 06, 2026" and "2026-02-27"
  const cleaned = str.replace(/^[A-Za-z]+,\s*/, "").trim();
  // If it looks like ISO (YYYY-MM-DD), parse directly — some browsers
  // mis-parse DD-MM-YYYY or treat it as UTC causing off-by-one issues.
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
    return isNaN(d) ? null : d;
  }
  try {
    const d = new Date(cleaned);
    return isNaN(d) ? null : d;
  } catch {
    return null;
  }
}

function yearFromDate(str) {
  const d = parseDate(str);
  return d ? d.getFullYear() : null;
}

function statusClass(status) {
  if (!status) return "status-other";
  const s = status.toUpperCase();
  if (s === "TIMEOUS") return "status-timeous";
  if (s === "LATE") return "status-late";
  if (s === "LAPSED" || s === "L") return "status-lapsed";
  if (s.includes("146") || s.startsWith("R")) return "status-r146";
  return "status-other";
}

function daysClass(days) {
  if (days === null) return "days-na";
  if (days <= 14) return "days-fast";
  if (days <= 30) return "days-ok";
  return "days-slow";
}

function sortData(data, key, dir) {
  if (!key) return data;
  return [...data].sort((a, b) => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    // Date columns
    if (av instanceof Date && bv instanceof Date) {
      return dir === "asc" ? av - bv : bv - av;
    }
    if (typeof av === "number" && typeof bv === "number") {
      return dir === "asc" ? av - bv : bv - av;
    }
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

// ── Generic sortable table for summary sections ───────────────────────────────

function useSimpleSort(initialKey, initialDir = "desc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);
  const onSort = (col) => {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("desc"); }
  };
  return { sortKey, sortDir, onSort };
}

function SimpleSortTh({ col, label, sortKey, sortDir, onSort, style }) {
  const cls =
    sortKey === col
      ? sortDir === "asc" ? "sorted-asc" : "sorted-desc"
      : "";
  return (
    <th className={cls} style={style} onClick={() => onSort(col)}>
      {label}
    </th>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const label = status || "—";
  return <span className={`status-pill ${statusClass(status)}`}>{label}</span>;
}

function DaysChip({ days }) {
  if (days === null || isNaN(days)) return <span className="days-chip days-na">—</span>;
  return (
    <span className={`days-chip ${daysClass(days)}`}>
      {days}d
    </span>
  );
}

function Badge(props) {
  if (props.party) {
    let pic = props.pic;
    if (props.pic == 'Al Jama-ah') {
      pic = 'ALJ';
    } else if (props.pic == 'RISE Mzansi') {
      pic = 'RISE';
    } else if (props.pic == 'Action SA') {
      pic = 'ASA';
    }
    return <div className="party_member_badge" style={{ backgroundImage: `url(/assets/party-logos/${pic}.png)` }}></div>;
  }
  if (!props.pic) return null;
  return <div className="party_member_badge" style={{ backgroundImage: `url(https://static.pmg.org.za/${props.pic})` }}></div>;
}

function CardBar({ value, avg }) {
  return (
    <div className="card-bar">
      <div className="card-bar-fill" style={{ width: `${Math.min(parseFloat(value) || 0, 100)}%` }}></div>
      <div className="card-bar-mark" style={{ left: `${Math.min(parseFloat(avg) || 0, 100)}%` }}></div>
    </div>
  );
}

function SortTh({ col, label, sortKey, sortDir, onSort, style }) {
  const cls =
    sortKey === col
      ? sortDir === "asc"
        ? "sorted-asc"
        : "sorted-desc"
      : "";
  return (
    <th className={cls} style={style} onClick={() => onSort(col)}>
      {label}
    </th>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function QuestionsExplorer() {
  // ── Data state ──
  const [questionsData, setQuestionsData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [partiesData, setPartiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Explorer state ──
  const [filterParty, setFilterParty] = useState("All");
  const [filterMinister, setFilterMinister] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("pubDate");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedYear, setSelectedYear] = useState("All");

  // ── Summary-table sort states ──
  const minSort = useSimpleSort("count", "desc");
  const memberSort = useSimpleSort("count", "desc");
  const partySort = useSimpleSort("count", "desc");
  const lateSort = useSimpleSort("late", "desc");
  const fastSort = useSimpleSort("avg", "asc");


  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    Papa.parse("/data/questions/questions.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => { setQuestionsData(res.data); setLoading(false); },
      error: () => setLoading(false)
    });
    Papa.parse("/data/members-parties.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => setMembersData(res.data),
      error: () => {}
    });
    Papa.parse("/data/parties.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => setPartiesData(res.data),
      error: () => {}
    });
  }, []);

  // ─── Enriched dataset ───────────────────────────────────────────────────────

  // ─── Member lookup (id → member info) ──────────────────────────────────────
  const memberLookup = useMemo(() => {
    const map = {};
    membersData.forEach(m => {
      if (m.id) map[m.id] = m;
    });
    return map;
  }, [membersData]);

  // ─── Party lookup (id → party name) ────────────────────────────────────────
  const partyLookup = useMemo(() => {
    const map = {};
    partiesData.forEach(p => {
      if (p.id) map[p.id] = p.party;
    });
    return map;
  }, [partiesData]);

  const enrichedData = useMemo(() => {
    if (!questionsData.length) return [];
    return questionsData.map(row => {
      const pub = parseDate(row["Date of publication"]);
      const replied = parseDate(row["Date replied to"]);
      const displayStatus = (row["Response"] || "").trim();
      const daysToReply = (pub && replied)
        ? Math.round((replied - pub) / (1000 * 60 * 60 * 24))
        : null;
      // Guard against nonsensical negative values (bad dates / parsing)
      const safeDays = (daysToReply !== null && daysToReply >= 0) ? daysToReply : null;
      const pmgId = (row["pmg_id"] || "").trim();
      const memberId = (row["member_id"] || "").trim();
      const memberInfo = memberLookup[memberId];
      return {
        ...row,
        displayStatus,
        pubDate: pub,
        repliedDate: replied,
        daysToReply: safeDays,
        typeLabel: TYPE_LABELS[(row["type"] || "").trim()] || row["type"] || "",
        pmgUrl: pmgId ? `${PMG_BASE}${pmgId}/` : null,
        profile_pic: memberInfo?.profile_pic || null,
      };
    });
  }, [questionsData, memberLookup]);

  // ─── Years (derived from the loaded data) ──────────────────────────────────

  const years = useMemo(() => {
    const s = new Set();
    enrichedData.forEach(r => {
      const y = yearFromDate(r["Date of publication"]);
      if (y) s.add(y);
    });
    return ["All", ...Array.from(s).sort((a, b) => b - a)];
  }, [enrichedData]);

  // ─── Year-filtered dataset ──────────────────────────────────────────────────
  // All stats and summary tables below use this, so they reflect the selected
  // year (or "All" for the combined dataset).

  const yearData = useMemo(() => {
    if (selectedYear === "All") return enrichedData;
    return enrichedData.filter(r => r.pubDate && r.pubDate.getFullYear() === selectedYear);
  }, [enrichedData, selectedYear]);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!yearData.length) return null;
    let timeous = 0, late = 0, lapsed = 0, r146 = 0, other = 0;
    let totalDays = 0, countWithDays = 0;

    const byParty = {};
    const byMinister = {};
    const byMember = {};

    yearData.forEach(row => {
      const status = (row.displayStatus || "").toUpperCase().trim();
      if (status === "TIMEOUS") timeous++;
      else if (status === "LATE") late++;
      else if (status === "LAPSED" || status === "L") lapsed++;
      else if (status.includes("146") || status.startsWith("R146")) r146++;
      else other++;

      if (row.daysToReply !== null && !isNaN(row.daysToReply)) {
        totalDays += row.daysToReply;
        countWithDays++;
      }

      const party = (row["PARTY"] || "").trim();
      if (party) byParty[party] = (byParty[party] || 0) + 1;

      const exec = (row["Executive"] || row["department"] || "").trim();
      if (exec) byMinister[exec] = (byMinister[exec] || 0) + 1;

      const memName = (row["Member asking"] || "").trim();
      const memId = (row["member_id"] || "").trim();
      const memKey = memId || memName;
      if (memKey) {
        if (!byMember[memKey]) {
          const memInfo = memberLookup[memId];
          byMember[memKey] = {
            member: memName,
            count: 0,
            profile_pic: memInfo?.profile_pic || null,
            party: memInfo?.party_id ? partyLookup[memInfo.party_id] || null : null,
          };
        }
        byMember[memKey].count++;
      }
    });

    const topParties = Object.entries(byParty)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);

    const topMinisters = Object.entries(byMinister)
      .map(([minister, count]) => ({ minister, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    const topMembers = Object.values(byMember)
      .map(m => ({ member: m.member, count: m.count, profile_pic: m.profile_pic, party: m.party }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return {
      total: yearData.length,
      timeous, late, lapsed, r146, other,
      avgDays: countWithDays > 0 ? Math.round(totalDays / countWithDays) : null,
      topParties,
      topMinisters,
      topMembers,
    };
  }, [yearData, memberLookup, partyLookup]);

  // ─── Filter options ─────────────────────────────────────────────────────────

  const parties = useMemo(() => {
    const s = new Set(yearData.map(r => (r["PARTY"] || "").trim()).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [yearData]);

  const ministers = useMemo(() => {
    const s = new Set();
    yearData.forEach(r => {
      const v = (r["Executive"] || r["department"] || "").trim();
      if (v) s.add(v);
    });
    return ["All", ...Array.from(s).sort()];
  }, [yearData]);

  const statuses = useMemo(() => {
    const s = new Set(
      yearData.map(r => (r.displayStatus || "").trim()).filter(Boolean)
    );
    return ["All", ...Array.from(s).sort()];
  }, [yearData]);

  const questionTypes = useMemo(() => {
    const s = new Set(yearData.map(r => (r["type"] || "").trim()).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [yearData]);

  // ─── Filtered + sorted data ─────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    let data = yearData;

    if (filterType !== "All")
      data = data.filter(r => (r["type"] || "").trim() === filterType);

    if (filterParty !== "All")
      data = data.filter(r => (r["PARTY"] || "").trim() === filterParty);

    if (filterMinister !== "All")
      data = data.filter(r => {
        const exec = (r["Executive"] || r["department"] || "").trim();
        return exec === filterMinister;
      });

    if (filterStatus !== "All")
      data = data.filter(r => (r.displayStatus || "").trim() === filterStatus);

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      data = data.filter(r =>
        (r["ACC No"] || "").toLowerCase().includes(q) ||
        (r["Member asking"] || "").toLowerCase().includes(q) ||
        (r["Executive"] || r["department"] || "").toLowerCase().includes(q) ||
        (r["PARTY"] || "").toLowerCase().includes(q)
      );
    }

    return sortData(data, sortKey, sortDir);
  }, [yearData, filterType, filterParty, filterMinister, filterStatus, searchText, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col) {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
    setPage(1);
  }

  function resetFilters() {
    setFilterParty("All");
    setFilterMinister("All");
    setFilterStatus("All");
    setFilterType("All");
    setSearchText("");
    setPage(1);
  }

  // ─── Pagination helper ───────────────────────────────────────────────────────

  function Pagination({ current, total, onChange, count }) {
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="explorer-pagination">
        <button className="page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        {start > 1 && <><button className="page-btn" onClick={() => onChange(1)}>1</button>{start > 2 && <span>…</span>}</>}
        {pages.map(p => (
          <button key={p} className={`page-btn ${p === current ? "active" : ""}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        {end < total && <>{end < total - 1 && <span>…</span>}<button className="page-btn" onClick={() => onChange(total)}>{total}</button></>}
        <button className="page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
        <span className="page-info">
          {((current - 1) * PAGE_SIZE) + 1}–{Math.min(current * PAGE_SIZE, count)} of {count.toLocaleString()}
        </span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Fragment>
        <PMHeader />
        <PMTabs active="questions" />
        <div className="loading-state">Loading questions data…</div>
      </Fragment>
    );
  }

  const maxMinstCount = (stats?.topMinisters || []).slice(0, 1)[0]?.count || 1;
  const maxMemberCount = (stats?.topMembers || []).slice(0, 1)[0]?.count || 1;

  return (
    <Fragment>
      <PMHeader />
      <PMTabs active="questions" />

      {/* ══ Page title ═════════════════════════════════════════════════════════ */}
      <Container fluid className="pt-4">
        <div className="overview-container">
          <Row className="align-items-center">
            <Col>
              <h1>Questions Explorer</h1>
            </Col>
            <Col xs="auto">
              <div className="badge text-bg-dark py-1 px-2">
                {stats?.total.toLocaleString() || "…"} questions
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid className="pb-5">
        <div className="overview-container">

          {/* ── Sticky section nav ── */}
          <div className="qs-nav">
            <div>
              <a href="#status">Response status</a>
              <a href="#register">Questions explorer</a>
              <a href="#ministers">By minister</a>
              <a href="#members">By member</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="form-label">Year:</span>
              <Dropdown className="dropdown-select">
                <Dropdown.Toggle>
                  <Row>
                    <Col>{selectedYear}</Col>
                    <Col xs="auto">
                      <FontAwesomeIcon icon={faChevronDown} />
                    </Col>
                  </Row>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {years.map((year, index) => (
                    <Dropdown.Item key={index} onClick={() => setSelectedYear(year)}>
                      {year}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {/* ══ Section: Response status ══════════════════════════════════════ */}
          <section id="status">
            <div className="section-header mt-2 mb-4">
              <Row>
                <Col>
                  <div className="header-img-container">
                    <div className="header-img" style={{ backgroundImage: "url('/assets/member-activities.jpeg')" }}></div>
                    <h2 style={{ left: "3%" }}>Response status</h2>
                  </div>
                </Col>
                <Col className="d-flex align-items-center">
                  <div className="section-intro">
                    How are ministers responding to written questions? Track timeous, late, and lapsed responses across the register.
                  </div>
                </Col>
              </Row>
            </div>
            <Row className="mb-4">
              <Col md={5} className="mb-4 mb-md-0">
                <div className="dashboard-card h-100">
                  <h3>Response status</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    {stats?.total.toLocaleString()} questions tracked
                  </p>
                  {stats && (
                    <>
                      <div className="status-summary-row mt-3">
                        {[
                          { key: "timeous", label: "Timeous", count: stats.timeous, cls: "ss-timeous" },
                          { key: "late", label: "Late", count: stats.late, cls: "ss-late" },
                          { key: "lapsed", label: "Lapsed", count: stats.lapsed, cls: "ss-lapsed" },
                          { key: "r146", label: "Rule 146", count: stats.r146, cls: "ss-r146" },
                          { key: "other", label: "Other", count: stats.other, cls: "ss-other" },
                        ].map(({ key, label, count, cls }) => (
                          <div key={key} className={`status-summary-item ${cls}`}>
                            <div className="ss-count">{count.toLocaleString()}</div>
                            <div className="ss-pct">{((count / stats.total) * 100).toFixed(1)}%</div>
                            <div className="ss-label">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="seperator mt-3 mb-2" />
                      <div>
                        <h4 className="mb-1">On-time response rate</h4>
                        <div style={{ fontSize: 28, fontFamily: "'General Sans Semibold', sans-serif" }}>
                          {((stats.timeous / stats.total) * 100).toFixed(1)}%
                        </div>
                        <div className="response-time-bar mt-1">
                          <div
                            className="rt-fill rt-timeous"
                            style={{ width: `${((stats.timeous / stats.total) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                          {stats.avgDays !== null
                            ? `Average ${stats.avgDays} days to reply · 14-day rule requirement`
                            : "Response timing data limited"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Col>

              <Col md={7}>
                <div className="dashboard-card h-100">
                  <h3>Ministers receiving the most questions</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Across all question types</p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 260 }}>
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "70%" }}>Executive / Minister</th>
                            <th>Questions</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.topMinisters || []).slice(0, 30).map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{m.minister}</td>
                              <td>{m.count}</td>
                              <td style={{ minWidth: 80 }}>
                                <CardBar value={(m.count / maxMinstCount) * 100} avg={50} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

          {/* ══ Section: Questions Explorer ══════════════════════════════════ */}
          <section id="register">
            <div className="section-header mt-2 mb-4">
              <Row>
                <Col>
                  <div className="header-img-container">
                    <div className="header-img" style={{ backgroundImage: "url('/assets/scheduling.jpeg')" }}></div>
                    <h2 style={{ left: "3%" }}>Questions Explorer</h2>
                  </div>
                </Col>
                <Col className="d-flex align-items-center">
                  <div className="section-intro">
                    Browse {yearData.length.toLocaleString()} questions from Parliament's Questions Register.
                    Where available, PMG links open the full question on pmg.org.za.
                    Filter by type, party, minister, or status. Click column headers to sort.
                  </div>
                </Col>
              </Row>
            </div>

            <div className="dashboard-card mb-4">
              {/* Filter bar */}
              <div className="explorer-filters">
                <div className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 12, color: "#999" }} />
                  <input
                    type="text"
                    placeholder="Search member, minister, code…"
                    value={searchText}
                    onChange={e => { setSearchText(e.target.value); setPage(1); }}
                    style={{ minWidth: 220 }}
                  />
                </div>

                <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                  <option value="All">All types</option>
                  {questionTypes.filter(t => t !== "All").map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                  ))}
                </select>

                <select value={filterParty} onChange={e => { setFilterParty(e.target.value); setPage(1); }}>
                  <option value="All">All parties</option>
                  {parties.filter(p => p !== "All").map(p => <option key={p}>{p}</option>)}
                </select>

                <select value={filterMinister} onChange={e => { setFilterMinister(e.target.value); setPage(1); }}>
                  <option value="All">All ministers</option>
                  {ministers.filter(m => m !== "All").map(m => <option key={m}>{m}</option>)}
                </select>

                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                  <option value="All">All statuses</option>
                  {statuses.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}
                </select>

                {(filterParty !== "All" || filterMinister !== "All" || filterStatus !== "All" || filterType !== "All" || searchText) && (
                  <button className="filter-reset" onClick={resetFilters}>Reset filters</button>
                )}

                <span className="filter-label ms-auto">
                  {filteredData.length.toLocaleString()} questions
                </span>
              </div>

              {/* Table */}
              <div className="scroll-area">
                <Scrollbars style={{ height: 420 }}>
                  <Table className="sticky-header-table explorer-table" hover style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <SortTh col="ACC No" label="Code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 90 }} />
                        <SortTh col="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 90 }} />
                        <SortTh col="Member asking" label="Member" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 150 }} />
                        <SortTh col="PARTY" label="Party" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 90 }} />
                        <SortTh col="Executive" label="Minister / Executive" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 200 }} />
                        <SortTh col="pubDate" label="Published" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 120 }} />
                        <SortTh col="daysToReply" label="Days" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 65 }} />
                        <SortTh col="displayStatus" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ width: 90 }} />
                        <th style={{ width: 70 }}>PMG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 ? (
                        <tr><td colSpan={10} className="empty-state">No questions match your filters</td></tr>
                      ) : (
                        pagedData.map((row, i) => {
                          const rowNum = (page - 1) * PAGE_SIZE + i + 1;
                          const status = (row.displayStatus || "").trim();
                          const pub = row["Date of publication"] || "";
                          const pubShort = pub ? pub.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /, "") : "—";
                          const member = (row["Member asking"] || "").trim();
                          const exec = (row["Executive"] || row["department"] || "").trim();

                          return (
                            <tr key={i}>
                              <td style={{ color: "#bbb" }}>{rowNum}</td>
                              <td style={{ fontFamily: "'General Sans Medium', sans-serif", color: "#333" }}>
                                {row["ACC No"] || "—"}
                              </td>
                              <td>
                                <span className="type-pill">{row.typeLabel || "—"}</span>
                              </td>
                              <td>{member ? <><Badge pic={row.profile_pic} />{member}</> : "—"}</td>
                              <td>
                                {(row["PARTY"] || "").trim() ? (
                                  <span className="party-pill" style={{ fontSize: 9 }}>
                                    {(row["PARTY"] || "").trim()}
                                  </span>
                                ) : <span style={{ color: "#ddd" }}>—</span>}
                              </td>
                              <td>{exec || "—"}</td>
                              <td style={{ whiteSpace: "nowrap", color: "#666" }}>{pubShort || "—"}</td>
                              <td><DaysChip days={row.daysToReply} /></td>
                              <td><StatusPill status={status} /></td>
                              <td>
                                {row.pmgUrl ? (
                                  <a href={row.pmgUrl} target="_blank" rel="noopener noreferrer" className="pmg-link">
                                    View <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: 9 }} />
                                  </a>
                                ) : <span style={{ color: "#ddd" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </Scrollbars>
              </div>

              <Pagination current={page} total={totalPages} onChange={p => setPage(p)} count={filteredData.length} />
            </div>
          </section>

          {/* ══ Section: By minister + By member ════════════════════════════ */}
          <section id="ministers">
            <div className="section-header mt-2 mb-4">
              <Row>
                <Col>
                  <div className="header-img-container">
                    <div className="header-img" style={{ backgroundImage: "url('/assets/member-activities.jpeg')" }}></div>
                    <h2 style={{ left: "3%" }}>Minister &amp; Member activity</h2>
                  </div>
                </Col>
                <Col className="d-flex align-items-center">
                  <div className="section-intro">
                    Which ministers face the most scrutiny? Which members are most active in holding the executive to account?
                  </div>
                </Col>
              </Row>
            </div>

            <Row className="mb-4" id="members">
              <Col md={6} className="mb-4 mb-md-0">
                <div className="dashboard-card h-100">
                  <h3>Questions sent to ministers</h3>
                  <div className="card-big-text mt-2">{stats?.total.toLocaleString()}</div>
                  <div className="card-subtext">total questions</div>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 300 }}>
                      <Table className="sticky-header-table sortable-summary">
                        <thead>
                          <tr>
                            <th></th>
                            <SimpleSortTh col="minister" label="Minister" sortKey={minSort.sortKey} sortDir={minSort.sortDir} onSort={minSort.onSort} style={{ width: "55%" }} />
                            <SimpleSortTh col="count" label="Questions" sortKey={minSort.sortKey} sortDir={minSort.sortDir} onSort={minSort.onSort} />
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(stats?.topMinisters || [], minSort.sortKey, minSort.sortDir).map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{m.minister}</td>
                              <td>{m.count}</td>
                              <td style={{ minWidth: 80 }}>
                                <CardBar value={(m.count / maxMinstCount) * 100} avg={50} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className="dashboard-card h-100">
                  <h3>Members who submitted the most questions</h3>
                  <div className="card-big-text mt-2">{(stats?.topMembers.reduce((s, m) => s + m.count, 0) || 0).toLocaleString()}</div>
                  <div className="card-subtext">questions by top 30 members</div>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 300 }}>
                      <Table className="sticky-header-table sortable-summary">
                        <thead>
                          <tr>
                            <th></th>
                            <SimpleSortTh col="member" label="Member" sortKey={memberSort.sortKey} sortDir={memberSort.sortDir} onSort={memberSort.onSort} style={{ width: "55%" }} />
                            <SimpleSortTh col="party" label="Party" sortKey={memberSort.sortKey} sortDir={memberSort.sortDir} onSort={memberSort.onSort} />
                            <SimpleSortTh col="count" label="Questions" sortKey={memberSort.sortKey} sortDir={memberSort.sortDir} onSort={memberSort.onSort} />
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(stats?.topMembers || [], memberSort.sortKey, memberSort.sortDir).map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td><Badge pic={m.profile_pic} />{m.member}</td>
                              <td>
                                {m.party ? (
                                  <span className="party-pill" style={{ fontSize: 9 }}>{m.party}</span>
                                ) : <span style={{ color: "#ddd" }}>—</span>}
                              </td>
                              <td>{m.count}</td>
                              <td style={{ minWidth: 80 }}>
                                <CardBar value={(m.count / maxMemberCount) * 100} avg={50} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>
            </Row>

            {/* ── Party breakdown ── */}
            <Row className="mb-4">
              <Col md={12}>
                <div className="dashboard-card">
                  <h3>Questions asked by party</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    How many questions each party submitted
                  </p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 220 }}>
                      <Table className="sticky-header-table sortable-summary">
                        <thead>
                          <tr>
                            <th></th>
                            <SimpleSortTh col="party" label="Party" sortKey={partySort.sortKey} sortDir={partySort.sortDir} onSort={partySort.onSort} style={{ width: "40%" }} />
                            <SimpleSortTh col="count" label="Questions" sortKey={partySort.sortKey} sortDir={partySort.sortDir} onSort={partySort.onSort} />
                            <SimpleSortTh col="pct" label="% of total" sortKey={partySort.sortKey} sortDir={partySort.sortDir} onSort={partySort.onSort} />
                            <th style={{ minWidth: 120 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(
                            (stats?.topParties || []).map(p => ({ ...p, pct: (p.count / (stats?.total || 1)) * 100 })),
                            partySort.sortKey, partySort.sortDir
                          ).map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                <span className="party-pill">{p.party}</span>
                              </td>
                              <td>{p.count}</td>
                              <td>{p.pct.toFixed(1)}%</td>
                              <td>
                                <CardBar
                                  value={(p.count / (stats?.topParties[0]?.count || 1)) * 100}
                                  avg={100 / (stats?.topParties.length || 1)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>
            </Row>

            {/* ── Late responses breakdown by minister ── */}
            <Row className="mb-4">
              <Col md={6} className="mb-4 mb-md-0">
                <div className="dashboard-card h-100">
                  <h3>Ministers with most late responses</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Based on response status data</p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 260 }}>
                      <Table className="sticky-header-table sortable-summary">
                        <thead>
                          <tr>
                            <th></th>
                            <SimpleSortTh col="minister" label="Executive" sortKey={lateSort.sortKey} sortDir={lateSort.sortDir} onSort={lateSort.onSort} style={{ width: "50%" }} />
                            <SimpleSortTh col="late" label="Late" sortKey={lateSort.sortKey} sortDir={lateSort.sortDir} onSort={lateSort.onSort} />
                            <SimpleSortTh col="total" label="Total" sortKey={lateSort.sortKey} sortDir={lateSort.sortDir} onSort={lateSort.onSort} />
                            <SimpleSortTh col="pct" label="%" sortKey={lateSort.sortKey} sortDir={lateSort.sortDir} onSort={lateSort.onSort} />
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const byMin = {};
                            yearData.forEach(row => {
                              const exec = (row["Executive"] || row["department"] || "").trim();
                              if (!exec) return;
                              if (!byMin[exec]) byMin[exec] = { total: 0, late: 0 };
                              byMin[exec].total++;
                              const s = (row.displayStatus || "").toUpperCase().trim();
                              if (s === "LATE") byMin[exec].late++;
                            });
                            return sortData(
                              Object.entries(byMin)
                                .map(([m, d]) => ({ minister: m, ...d, pct: d.total > 0 ? (d.late / d.total) * 100 : 0 }))
                                .filter(d => d.late > 0),
                              lateSort.sortKey, lateSort.sortDir
                            ).slice(0, 20).map((d, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{d.minister}</td>
                                <td style={{ color: "#dc2626", fontFamily: "'General Sans Semibold', sans-serif" }}>{d.late}</td>
                                <td>{d.total}</td>
                                <td>{d.pct.toFixed(0)}%</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="dashboard-card h-100">
                  <h3>Ministers with the fastest response times</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Average days to reply (answered questions only)</p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 260 }}>
                      <Table className="sticky-header-table sortable-summary">
                        <thead>
                          <tr>
                            <th></th>
                            <SimpleSortTh col="minister" label="Executive" sortKey={fastSort.sortKey} sortDir={fastSort.sortDir} onSort={fastSort.onSort} style={{ width: "50%" }} />
                            <SimpleSortTh col="avg" label="Avg days" sortKey={fastSort.sortKey} sortDir={fastSort.sortDir} onSort={fastSort.onSort} />
                            <SimpleSortTh col="count" label="Questions" sortKey={fastSort.sortKey} sortDir={fastSort.sortDir} onSort={fastSort.onSort} />
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const byMin = {};
                            yearData.forEach(row => {
                              const exec = (row["Executive"] || row["department"] || "").trim();
                              if (!exec || row.daysToReply === null || isNaN(row.daysToReply) || row.daysToReply < 0) return;
                              if (!byMin[exec]) byMin[exec] = { total: 0, sumDays: 0 };
                              byMin[exec].total++;
                              byMin[exec].sumDays += row.daysToReply;
                            });
                            return sortData(
                              Object.entries(byMin)
                                .map(([m, d]) => ({ minister: m, count: d.total, avg: d.total > 0 ? Math.round(d.sumDays / d.total) : 999 }))
                                .filter(d => d.count >= 3),
                              fastSort.sortKey, fastSort.sortDir
                            ).slice(0, 20).map((d, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{d.minister}</td>
                                <td>
                                  <DaysChip days={d.avg} />
                                </td>
                                <td>{d.count}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </Table>
                    </Scrollbars>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

        </div>
      </Container>
    </Fragment>
  );
}

export default QuestionsExplorer;
