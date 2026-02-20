import React, { Fragment, useEffect, useState, useMemo } from "react";

import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";

import "./style.scss";
import "../overview/style.scss";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExternalLinkAlt,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faCircleInfo,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { Scrollbars } from "react-custom-scrollbars";
import Papa from "papaparse";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 75;

const PMG_BASE = "https://pmg.org.za/question/";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRegisterDate(str) {
  if (!str || typeof str !== "string") return null;
  // e.g. "Thursday, February 06, 2025" or "Friday, March 07, 2025"
  try {
    const d = new Date(str.replace(/^[A-Za-z]+, /, ""));
    return isNaN(d) ? null : d;
  } catch {
    return null;
  }
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const diff = (b - a) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
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
    if (typeof av === "number" && typeof bv === "number") {
      return dir === "asc" ? av - bv : bv - av;
    }
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ has, label }) {
  return (
    <span className={`source-badge ${has ? `source-${label.toLowerCase()}` : "source-missing"}`}>
      {label}
    </span>
  );
}

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
  const [masterData, setMasterData] = useState([]);
  const [registerData, setRegisterData] = useState([]);
  const [pmgData, setPmgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSourceAnalysis, setShowSourceAnalysis] = useState(false);

  // ── Explorer state ──
  const [filterParty, setFilterParty] = useState("All");
  const [filterMinister, setFilterMinister] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSource, setFilterSource] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("pubDate");
  const [sortDir, setSortDir] = useState("desc");


  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let loaded = 0;
    const check = () => { loaded++; if (loaded === 3) setLoading(false); };

    Papa.parse("/data/questions/master_sheet.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => { setMasterData(res.data); check(); },
      error: () => check()
    });

    Papa.parse("/data/questions/register.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => {
        const enriched = res.data.map(row => {
          const pub = parseRegisterDate(row["Date of publication"]);
          const replied = parseRegisterDate(row["Date replied to"]);
          // "Response" col = Timeous/Late/LAPSED/R146(1) — use for display
          // "Status" col = A/L/R146(1) — abbreviation codes, skip
          const displayStatus = (row["Response"] || "").trim();
          return {
            ...row,
            displayStatus,
            pubDate: pub,
            repliedDate: replied,
            daysToReply: daysBetween(pub, replied)
          };
        });
        setRegisterData(enriched);
        check();
      },
      error: () => check()
    });

    Papa.parse("/data/questions/questions-pmg.csv", {
      download: true, header: true, skipEmptyLines: true,
      delimiter: ",",
      transformHeader: h => h.trim(),
      complete: (res) => { setPmgData(res.data); check(); },
      error: () => check()
    });
  }, []);

  // ─── Merged dataset (Register + PMG) ────────────────────────────────────────

  const mergedData = useMemo(() => {
    if (!registerData.length && !pmgData.length) return [];

    // Normalize code: "NW1E" → "NW1", "NW4309" stays "NW4309"
    const normalize = code => (code || "").trim().replace(/E$/, "");

    // Build PMG lookup by normalized code
    const pmgByCode = new Map();
    pmgData.forEach(row => {
      const code = normalize(row["Code"]);
      if (code) pmgByCode.set(code, row);
    });

    const matched = new Set();

    // Process register rows — enrich with PMG link where code matches
    const registerRows = registerData.map(row => {
      const accNo = (row["ACC No"] || "").trim();
      const code = normalize(accNo);
      const pmgRow = pmgByCode.get(code);
      if (pmgRow) matched.add(code);
      const pmgId = pmgRow ? pmgRow["ID"] : null;
      return {
        ...row,
        _code: code,
        _source: pmgRow ? "both" : "register",
        pmgUrl: pmgId ? `${PMG_BASE}${pmgId}/` : null,
        pmgIntro: pmgRow ? (pmgRow["Intro"] || "").trim() : "",
      };
    });

    // PMG-only rows (not matched to any register entry)
    const pmgOnlyRows = [];
    pmgData.forEach(pmgRow => {
      const code = normalize(pmgRow["Code"]);
      if (matched.has(code)) return;
      const pmgId = pmgRow["ID"];
      const pmgDateStr = (pmgRow["Date"] || "").trim();
      pmgOnlyRows.push({
        _code: code,
        _source: "pmg",
        "ACC No": pmgRow["Code"] || "",
        "Member asking": (pmgRow["Asked By Name"] || "").trim(),
        "PARTY": "",
        "Executive": (pmgRow["Question To Name"] || "").trim(),
        "Date of publication": pmgDateStr,
        "Due Date": "",
        "Date replied to": "",
        "Response": "",
        "Status": "",
        "NOTES": "",
        displayStatus: "",
        pubDate: pmgDateStr ? new Date(pmgDateStr) : null,
        repliedDate: null,
        daysToReply: null,
        pmgUrl: pmgId ? `${PMG_BASE}${pmgId}/` : null,
        pmgIntro: (pmgRow["Intro"] || "").trim(),
      });
    });

    return [...registerRows, ...pmgOnlyRows];
  }, [registerData, pmgData]);

  // ─── Coverage stats (master_sheet) ──────────────────────────────────────────

  const coverage = useMemo(() => {
    if (!masterData.length) return null;
    const total = masterData.length;
    let pmg = 0, reg = 0, scrape = 0, all3 = 0, two = 0, one = 0, none = 0;

    masterData.forEach(row => {
      const p = Number(row.PMG) === 1;
      const r = Number(row.Register) === 1;
      const s = Number(row.Scrape) === 1;
      if (p) pmg++;
      if (r) reg++;
      if (s) scrape++;
      const count = [p, r, s].filter(Boolean).length;
      if (count === 3) all3++;
      else if (count === 2) two++;
      else if (count === 1) one++;
      else none++;
    });

    return { total, pmg, reg, scrape, all3, two, one, none };
  }, [masterData]);

  // ─── Register stats ─────────────────────────────────────────────────────────

  const registerStats = useMemo(() => {
    if (!registerData.length) return null;
    let timeous = 0, late = 0, lapsed = 0, r146 = 0, other = 0;
    let totalDays = 0, countWithDays = 0;

    const byParty = {};
    const byMinister = {};

    registerData.forEach(row => {
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

      const exec = (row["Executive"] || "").trim();
      if (exec) byMinister[exec] = (byMinister[exec] || 0) + 1;
    });

    const topParties = Object.entries(byParty)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);

    const topMinisters = Object.entries(byMinister)
      .map(([minister, count]) => ({ minister, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: registerData.length,
      timeous, late, lapsed, r146, other,
      avgDays: countWithDays > 0 ? Math.round(totalDays / countWithDays) : null,
      topParties,
      topMinisters
    };
  }, [registerData]);

  // ─── PMG stats ──────────────────────────────────────────────────────────────

  const pmgStats = useMemo(() => {
    if (!pmgData.length) return null;

    const byMinister = {};
    const byMember = {};

    pmgData.forEach(row => {
      const min = (row["Question To Name"] || "").trim();
      if (min) byMinister[min] = (byMinister[min] || 0) + 1;

      const mem = (row["Asked By Name"] || "").trim();
      if (mem) byMember[mem] = (byMember[mem] || 0) + 1;
    });

    const topMinisters = Object.entries(byMinister)
      .map(([minister, count]) => ({ minister, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    const topMembers = Object.entries(byMember)
      .map(([member, count]) => ({ member, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return { total: pmgData.length, topMinisters, topMembers };
  }, [pmgData]);

  // ─── Filter options ─────────────────────────────────────────────────────────

  const parties = useMemo(() => {
    const s = new Set(registerData.map(r => (r["PARTY"] || "").trim()).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [registerData]);

  const ministers = useMemo(() => {
    const s = new Set();
    registerData.forEach(r => { const v = (r["Executive"] || "").trim(); if (v) s.add(v); });
    pmgData.forEach(r => { const v = (r["Question To Name"] || "").trim(); if (v) s.add(v); });
    return ["All", ...Array.from(s).sort()];
  }, [registerData, pmgData]);

  const statuses = useMemo(() => {
    const s = new Set(
      registerData.map(r => (r.displayStatus || "").trim()).filter(Boolean)
    );
    return ["All", ...Array.from(s).sort()];
  }, [registerData]);

  // ─── Filtered + sorted merged data ──────────────────────────────────────────

  const filteredRegister = useMemo(() => {
    let data = mergedData;

    if (filterParty !== "All")
      data = data.filter(r => (r["PARTY"] || "").trim() === filterParty);

    if (filterMinister !== "All")
      data = data.filter(r => (r["Executive"] || "").trim() === filterMinister);

    if (filterStatus !== "All")
      data = data.filter(r => (r.displayStatus || "").trim() === filterStatus);

    if (filterSource === "PMG only") data = data.filter(r => r._source === "pmg");
    else if (filterSource === "Register only") data = data.filter(r => r._source === "register");
    else if (filterSource === "Both") data = data.filter(r => r._source === "both");

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      data = data.filter(r =>
        (r["ACC No"] || "").toLowerCase().includes(q) ||
        (r["Member asking"] || "").toLowerCase().includes(q) ||
        (r["Executive"] || "").toLowerCase().includes(q) ||
        (r["PARTY"] || "").toLowerCase().includes(q) ||
        (r._code || "").toLowerCase().includes(q)
      );
    }

    return sortData(data, sortKey, sortDir);
  }, [mergedData, filterParty, filterMinister, filterStatus, filterSource, searchText, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRegister.length / PAGE_SIZE));
  const pagedRegister = filteredRegister.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col) {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
    setPage(1);
  }

  function resetFilters() {
    setFilterParty("All");
    setFilterMinister("All");
    setFilterStatus("All");
    setFilterSource("All");
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

  const maxMinstCount = (registerStats?.topMinisters || []).slice(0, 1)[0]?.count || 1;
  const maxMemberCount = (pmgStats?.topMembers || []).slice(0, 1)[0]?.count || 1;

  return (
    <Fragment>
      <PMHeader />
      <PMTabs active="questions" />

      {/* ══ Page title — plain h1 like overview page ═════════════════════════ */}
      <Container fluid className="pt-4">
        <div className="overview-container">
          <Row className="align-items-center">
            <Col>
              <h1>Questions Explorer</h1>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid className="pb-5">
        <div className="overview-container">

          {/* ── Sticky section nav ── */}
          <div className="qs-nav">
            <a href="#status">Response status</a>
            <a href="#register">Questions explorer</a>
            <a href="#ministers">By minister</a>
            <a href="#members">By member</a>
            <button
              onClick={() => setShowSourceAnalysis(v => !v)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              Data sources
            </button>
          </div>

          {/* ══ Source analysis accordion (hidden by default) ════════════════ */}
          <section id="source-analysis" style={{
            maxHeight: showSourceAnalysis ? 800 : 0,
            overflow: "hidden",
            transition: "max-height 0.4s ease",
            marginBottom: showSourceAnalysis ? "1.5rem" : 0
          }}>
            <Row className="mb-4">
              <Col md={6} className="mb-4 mb-md-0">
                <div className="dashboard-card h-100">
                  <h3>Coverage by source</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    How many questions appear in each source out of {coverage?.total.toLocaleString()} tracked
                  </p>
                  {coverage && (
                    <div className="mt-3">
                      {[
                        { label: "PMG", fill: "fill-pmg", count: coverage.pmg },
                        { label: "Parliament Register", fill: "fill-reg", count: coverage.reg },
                        { label: "Parliament Website", fill: "fill-scrape", count: coverage.scrape },
                      ].map(({ label, fill, count }) => (
                        <div className="coverage-bar-wrap" key={label}>
                          <span className="coverage-label">{label}</span>
                          <div className="coverage-bar-track">
                            <div
                              className={`coverage-bar-fill ${fill}`}
                              style={{ width: `${((count / coverage.total) * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="coverage-pct">{((count / coverage.total) * 100).toFixed(1)}%</span>
                          <span className="coverage-count">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="seperator mt-3 mb-3" />
                  <p style={{ fontSize: 11, color: "#999" }}>
                    <FontAwesomeIcon icon={faCircleInfo} className="me-1" />
                    Coverage gaps indicate questions that exist in one source but are missing from others — a measure of data completeness across the three platforms.
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <div className="dashboard-card h-100">
                  <h3>How many sources per question?</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    Cross-source matching tells us how well the three platforms talk to each other
                  </p>
                  {coverage && (
                    <>
                      <div className="overlap-grid mt-3">
                        <div className="overlap-cell overlap-all">
                          <div className="overlap-count">{coverage.all3.toLocaleString()}</div>
                          <div className="overlap-pct">{((coverage.all3 / coverage.total) * 100).toFixed(1)}%</div>
                          <div className="overlap-label">In all 3 sources</div>
                        </div>
                        <div className="overlap-cell overlap-two">
                          <div className="overlap-count">{coverage.two.toLocaleString()}</div>
                          <div className="overlap-pct">{((coverage.two / coverage.total) * 100).toFixed(1)}%</div>
                          <div className="overlap-label">In 2 sources</div>
                        </div>
                        <div className="overlap-cell overlap-one">
                          <div className="overlap-count">{coverage.one.toLocaleString()}</div>
                          <div className="overlap-pct">{((coverage.one / coverage.total) * 100).toFixed(1)}%</div>
                          <div className="overlap-label">In 1 source only</div>
                        </div>
                        <div className="overlap-cell overlap-none">
                          <div className="overlap-count">{coverage.none.toLocaleString()}</div>
                          <div className="overlap-pct">{((coverage.none / coverage.total) * 100).toFixed(1)}%</div>
                          <div className="overlap-label">Unmatched</div>
                        </div>
                      </div>
                      <div className="seperator mt-3 mb-3" />
                      <div style={{ fontSize: 11 }} className="d-flex gap-3 flex-wrap">
                        <div className="stat-highlight stat-blue flex-fill">
                          <div className="stat-number">{coverage.pmg.toLocaleString()}</div>
                          <div className="stat-label">PMG questions</div>
                        </div>
                        <div className="stat-highlight stat-green flex-fill">
                          <div className="stat-number">{coverage.reg.toLocaleString()}</div>
                          <div className="stat-label">Register questions</div>
                        </div>
                        <div className="stat-highlight stat-amber flex-fill">
                          <div className="stat-number">{coverage.scrape.toLocaleString()}</div>
                          <div className="stat-label">Parl website</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </section>

          {/* ══ Section: Response status (from register) ══════════════════════ */}
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
                    From Parliament's Questions Register — {registerStats?.total.toLocaleString()} questions tracked
                  </p>
                  {registerStats && (
                    <>
                      <div className="status-summary-row mt-3">
                        {[
                          { key: "timeous", label: "Timeous", count: registerStats.timeous, cls: "ss-timeous" },
                          { key: "late", label: "Late", count: registerStats.late, cls: "ss-late" },
                          { key: "lapsed", label: "Lapsed", count: registerStats.lapsed, cls: "ss-lapsed" },
                          { key: "r146", label: "Rule 146", count: registerStats.r146, cls: "ss-r146" },
                          { key: "other", label: "Other", count: registerStats.other, cls: "ss-other" },
                        ].map(({ key, label, count, cls }) => (
                          <div key={key} className={`status-summary-item ${cls}`}>
                            <div className="ss-count">{count.toLocaleString()}</div>
                            <div className="ss-pct">{((count / registerStats.total) * 100).toFixed(1)}%</div>
                            <div className="ss-label">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="seperator mt-3 mb-2" />
                      <div>
                        <h4 className="mb-1">On-time response rate</h4>
                        <div style={{ fontSize: 28, fontFamily: "'General Sans Semibold', sans-serif" }}>
                          {((registerStats.timeous / registerStats.total) * 100).toFixed(1)}%
                        </div>
                        <div className="response-time-bar mt-1">
                          <div
                            className="rt-fill rt-timeous"
                            style={{ width: `${((registerStats.timeous / registerStats.total) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                          {registerStats.avgDays !== null
                            ? `Average ${registerStats.avgDays} days to reply · 14-day rule requirement`
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
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>From Parliament's Questions Register</p>
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
                          {(registerStats?.topMinisters || []).slice(0, 30).map((m, i) => (
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

          {/* ══ Section: Questions Explorer (merged Register + PMG) ══════════ */}
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
                    Browse {mergedData.length.toLocaleString()} written questions combining Parliament's Questions
                    Register and PMG's database. PMG links open the full question on pmg.org.za.
                    Filter by party, minister, status, or source. Click column headers to sort.
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

                <select value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
                  <option value="All">All sources</option>
                  <option value="Both">In both sources</option>
                  <option value="Register only">Register only</option>
                  <option value="PMG only">PMG only</option>
                </select>

                {(filterParty !== "All" || filterMinister !== "All" || filterStatus !== "All" || filterSource !== "All" || searchText) && (
                  <button className="filter-reset" onClick={resetFilters}>Reset filters</button>
                )}

                <span className="filter-label ms-auto">
                  {filteredRegister.length.toLocaleString()} questions
                </span>
              </div>

              {/* Table */}
              <div className="scroll-area">
                <Scrollbars style={{ height: 420 }}>
                  <Table className="sticky-header-table explorer-table" hover>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>#</th>
                        <SortTh col="ACC No" label="Code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 80 }} />
                        <SortTh col="Member asking" label="Member" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 130 }} />
                        <SortTh col="PARTY" label="Party" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 80 }} />
                        <SortTh col="Executive" label="Minister / Executive" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 160 }} />
                        <SortTh col="pubDate" label="Published" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 100 }} />
                        <SortTh col="daysToReply" label="Days" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 55 }} />
                        <SortTh col="displayStatus" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 80 }} />
                        <th style={{ minWidth: 50 }}>PMG</th>
                        <th style={{ minWidth: 90 }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRegister.length === 0 ? (
                        <tr><td colSpan={10} className="empty-state">No questions match your filters</td></tr>
                      ) : (
                        pagedRegister.map((row, i) => {
                          const rowNum = (page - 1) * PAGE_SIZE + i + 1;
                          const status = (row.displayStatus || "").trim();
                          const notes = (row["NOTES"] || "").trim();
                          const pub = row["Date of publication"] || "";
                          const pubShort = pub ? pub.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /, "") : "—";
                          const member = (row["Member asking"] || "").trim();
                          const intro = row.pmgIntro || "";

                          return (
                            <tr key={i} style={row._source === "pmg" ? { color: "#999" } : {}}>
                              <td style={{ color: "#bbb" }}>{rowNum}</td>
                              <td style={{ fontFamily: "'General Sans Medium', sans-serif", color: row._source === "pmg" ? "#aaa" : "#333" }}>
                                {row["ACC No"] || "—"}
                              </td>
                              <td>
                                {intro ? (
                                  <OverlayTrigger
                                    placement="right"
                                    overlay={<Tooltip style={{ maxWidth: 340 }}>{intro.substring(0, 200)}{intro.length > 200 ? "…" : ""}</Tooltip>}
                                  >
                                    <span style={{ cursor: "help" }}>{member || "—"}</span>
                                  </OverlayTrigger>
                                ) : member || "—"}
                              </td>
                              <td>
                                {(row["PARTY"] || "").trim() ? (
                                  <span className="party-pill" style={{ fontSize: 9 }}>
                                    {(row["PARTY"] || "").trim()}
                                  </span>
                                ) : <span style={{ color: "#ddd" }}>—</span>}
                              </td>
                              <td>{(row["Executive"] || "").trim() || "—"}</td>
                              <td style={{ whiteSpace: "nowrap", color: "#666" }}>{pubShort || "—"}</td>
                              <td>{row._source !== "pmg" ? <DaysChip days={row.daysToReply} /> : <span style={{ color: "#ddd" }}>—</span>}</td>
                              <td>{row._source !== "pmg" ? <StatusPill status={status} /> : <span style={{ color: "#ddd" }}>—</span>}</td>
                              <td>
                                {row.pmgUrl ? (
                                  <a href={row.pmgUrl} target="_blank" rel="noopener noreferrer" className="pmg-link">
                                    View <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: 9 }} />
                                  </a>
                                ) : <span style={{ color: "#ddd" }}>—</span>}
                              </td>
                              <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {notes ? (
                                  <OverlayTrigger
                                    placement="left"
                                    overlay={<Tooltip style={{ maxWidth: 300 }}>{notes}</Tooltip>}
                                  >
                                    <span style={{ cursor: "help", color: "#d97706" }}>
                                      <FontAwesomeIcon icon={faTriangleExclamation} className="me-1" />
                                      {notes.substring(0, 30)}{notes.length > 30 ? "…" : ""}
                                    </span>
                                  </OverlayTrigger>
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

              <Pagination current={page} total={totalPages} onChange={p => setPage(p)} count={filteredRegister.length} />
            </div>
          </section>

          {/* ══ Section: By minister + By member (from overview) ═════════════ */}
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
                    Based on PMG's questions database of {pmgData.length.toLocaleString()} records.
                  </div>
                </Col>
              </Row>
            </div>

            <Row className="mb-4" id="members">
              <Col md={6} className="mb-4 mb-md-0">
                <div className="dashboard-card h-100">
                  <h3>Written questions sent to ministers</h3>
                  <div className="card-big-text mt-2">{pmgStats?.total.toLocaleString()}</div>
                  <div className="card-subtext">total written questions (PMG)</div>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 300 }}>
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "75%" }}>Minister</th>
                            <th>Questions</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pmgStats?.topMinisters || []).map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{m.minister}</td>
                              <td>{m.count}</td>
                              <td style={{ minWidth: 80 }}>
                                <CardBar value={(m.count / (pmgStats?.topMinisters[0]?.count || 1)) * 100} avg={50} />
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
                  <h3>Members who submitted the most written questions</h3>
                  <div className="card-big-text mt-2">{(pmgStats?.topMembers.reduce((s, m) => s + m.count, 0) || 0).toLocaleString()}</div>
                  <div className="card-subtext">questions by top 30 members</div>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 300 }}>
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "75%" }}>Member</th>
                            <th>Questions</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pmgStats?.topMembers || []).map((m, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{m.member}</td>
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
                  <h3>Questions asked by party (Register)</h3>
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    How many questions each party submitted in Parliament's Questions Register
                  </p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 220 }}>
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "40%" }}>Party</th>
                            <th>Questions</th>
                            <th>% of total</th>
                            <th style={{ minWidth: 120 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(registerStats?.topParties || []).map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                <span className="party-pill">{p.party}</span>
                              </td>
                              <td>{p.count}</td>
                              <td>{((p.count / (registerStats?.total || 1)) * 100).toFixed(1)}%</td>
                              <td>
                                <CardBar
                                  value={(p.count / (registerStats?.topParties[0]?.count || 1)) * 100}
                                  avg={100 / (registerStats?.topParties.length || 1)}
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
                  <p style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Based on Register data</p>
                  <div className="scroll-area mt-3">
                    <Scrollbars style={{ height: 260 }}>
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "60%" }}>Executive</th>
                            <th>Late</th>
                            <th>Total</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const byMin = {};
                            registerData.forEach(row => {
                              const exec = (row["Executive"] || "").trim();
                              if (!exec) return;
                              if (!byMin[exec]) byMin[exec] = { total: 0, late: 0 };
                              byMin[exec].total++;
                              const s = (row.displayStatus || "").toUpperCase().trim();
                              if (s === "LATE") byMin[exec].late++;
                            });
                            return Object.entries(byMin)
                              .map(([m, d]) => ({ minister: m, ...d, pct: d.total > 0 ? (d.late / d.total) * 100 : 0 }))
                              .filter(d => d.late > 0)
                              .sort((a, b) => b.pct - a.pct)
                              .slice(0, 20)
                              .map((d, i) => (
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
                      <Table className="sticky-header-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th style={{ width: "60%" }}>Executive</th>
                            <th>Avg days</th>
                            <th>Questions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const byMin = {};
                            registerData.forEach(row => {
                              const exec = (row["Executive"] || "").trim();
                              if (!exec || row.daysToReply === null || isNaN(row.daysToReply)) return;
                              if (!byMin[exec]) byMin[exec] = { total: 0, sumDays: 0 };
                              byMin[exec].total++;
                              byMin[exec].sumDays += row.daysToReply;
                            });
                            return Object.entries(byMin)
                              .map(([m, d]) => ({ minister: m, count: d.total, avg: d.total > 0 ? Math.round(d.sumDays / d.total) : 999 }))
                              .filter(d => d.count >= 3)
                              .sort((a, b) => a.avg - b.avg)
                              .slice(0, 20)
                              .map((d, i) => (
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

          {/* ── Data note ── */}
          <Row className="mb-4">
            <Col>
              <div className="dashboard-card" style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 20, color: "#d97706" }} />
                  </Col>
                  <Col>
                    <strong style={{ fontSize: 13 }}>About this data</strong>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#666" }}>
                      Questions are tracked across three sources: <strong>PMG</strong> (Parliamentary Monitoring Group),
                      Parliament's <strong>Questions Register</strong>, and Parliament's own <strong>website scrape</strong>.
                      Each source has different coverage, update frequency, and data fields — which is itself a transparency concern.
                      The <em>master_sheet</em> tracks cross-source matching. Source code for this dashboard is open.
                    </p>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

        </div>
      </Container>
    </Fragment>
  );
}

export default QuestionsExplorer;
