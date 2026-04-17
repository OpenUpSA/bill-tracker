import React, { Fragment, useEffect, useState, useMemo, useRef } from "react";
import PMHeader from "../pmheader";
import PMTabs from "../pmtabs";
import "./style.scss";
import "../overview/style.scss";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

// Register Chart.js components
Chart.register(...registerables, ChartDataLabels);

// ─── Constants ───────────────────────────────────────────────────────────────

const THREAD_PAGE_SIZE = 25;
const DETAIL_PAGE_SIZE = 50;

const COLORS = {
  new: '#b7eb9f',
  ongoing: '#999',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Main Component ──────────────────────────────────────────────────────────

function BRRRDashboard() {
  // ── Data state ──
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state ──
  const [filterCluster, setFilterCluster] = useState("");
  const [filterPC, setFilterPC] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterThread, setFilterThread] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterText, setFilterText] = useState("");

  // ── Pagination state ──
  const [threadPage, setThreadPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);

  // ── Chart refs ──
  const stackedChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const stackedChartInstance = useRef(null);
  const donutChartInstance = useRef(null);

  // ─── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/data/brrr-data.json')
      .then(res => res.json())
      .then(data => {
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading BRRR data:', err);
        setLoading(false);
      });
  }, []);

  // ─── Filtered data ───────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    return rawData.filter(r => {
      if (filterCluster && r.pc_cluster !== filterCluster) return false;
      if (filterPC && r.pc_name !== filterPC) return false;
      if (filterYear && r.year !== filterYear) return false;
      if (filterThread && r.thread_id !== filterThread) return false;
      if (filterEntity) {
        const entities = (r.entities_mentioned || '').split(',').map(e => e.trim());
        if (!entities.includes(filterEntity)) return false;
      }
      if (filterText) {
        const text = (r.raw_text || '').toLowerCase();
        if (!text.includes(filterText.toLowerCase())) return false;
      }
      return true;
    });
  }, [rawData, filterCluster, filterPC, filterYear, filterThread, filterEntity, filterText]);

  // ─── Filter options (cascading) ──────────────────────────────────────────────

  const filterOptions = useMemo(() => {
    const getFilteredExcluding = (exclude) => {
      return rawData.filter(r => {
        if (exclude !== 'cluster' && filterCluster && r.pc_cluster !== filterCluster) return false;
        if (exclude !== 'pc' && filterPC && r.pc_name !== filterPC) return false;
        if (exclude !== 'year' && filterYear && r.year !== filterYear) return false;
        if (exclude !== 'thread' && filterThread && r.thread_id !== filterThread) return false;
        if (exclude !== 'entity' && filterEntity) {
          const entities = (r.entities_mentioned || '').split(',').map(e => e.trim());
          if (!entities.includes(filterEntity)) return false;
        }
        if (exclude !== 'text' && filterText) {
          const text = (r.raw_text || '').toLowerCase();
          if (!text.includes(filterText.toLowerCase())) return false;
        }
        return true;
      });
    };

    const clusterPool = getFilteredExcluding('cluster');
    const clusters = [...new Set(clusterPool.map(r => r.pc_cluster))].filter(Boolean).sort();

    const pcPool = getFilteredExcluding('pc');
    const pcs = [...new Set(pcPool.map(r => r.pc_name))].filter(Boolean).sort();

    const yearPool = getFilteredExcluding('year');
    const years = [...new Set(yearPool.map(r => r.year))].filter(Boolean).sort();

    const threadPool = getFilteredExcluding('thread');
    const threadCounts = {};
    threadPool.forEach(r => {
      if (r.thread_id) threadCounts[r.thread_id] = (threadCounts[r.thread_id] || 0) + 1;
    });
    const threads = Object.entries(threadCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ value: id, label: `${id} (${count})` }));

    const entityPool = getFilteredExcluding('entity');
    const entityCounts = {};
    entityPool.forEach(r => {
      if (!r.entities_mentioned) return;
      r.entities_mentioned.split(',').forEach(e => {
        const entity = e.trim();
        if (entity) entityCounts[entity] = (entityCounts[entity] || 0) + 1;
      });
    });
    const entities = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: `${name} (${count})` }));

    return { clusters, pcs, years, threads, entities };
  }, [rawData, filterCluster, filterPC, filterYear, filterThread, filterEntity, filterText]);

  // ─── Scorecards ──────────────────────────────────────────────────────────────

  const scorecards = useMemo(() => {
    const uniqueThreads = new Set(filteredData.map(r => r.thread_id)).size;
    const totalRecs = new Set(filteredData.map(r => r.unique_id)).size;
    const ongoing = filteredData.filter(r => r.thread_start === 'FALSE');
    const scores = ongoing.map(r => parseFloat(r.similarity_score)).filter(v => !isNaN(v));
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    const highConf = ongoing.filter(r => r.confidence === 'High').length;
    const highPct = ongoing.length ? ((highConf / ongoing.length) * 100).toFixed(1) + '%' : '—';

    return { uniqueThreads, totalRecs, avgScore, highPct, avgScoreNum: parseFloat(avgScore), highPctNum: parseFloat(highPct) };
  }, [filteredData]);

  // ─── Reset filters ───────────────────────────────────────────────────────────

  const resetFilters = () => {
    setFilterCluster("");
    setFilterPC("");
    setFilterYear("");
    setFilterThread("");
    setFilterEntity("");
    setFilterText("");
    setThreadPage(1);
    setDetailPage(1);
  };

  // ─── Charts ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (stackedChartRef.current && filteredData.length > 0) {
      const years = [...new Set(filteredData.map(r => r.year))].filter(Boolean).sort();
      const newCounts = years.map(y =>
        new Set(filteredData.filter(r => r.year === y && r.thread_start === 'TRUE').map(r => r.unique_id)).size
      );
      const ongoingCounts = years.map(y =>
        new Set(filteredData.filter(r => r.year === y && r.thread_start === 'FALSE').map(r => r.unique_id)).size
      );

      const ctx = stackedChartRef.current.getContext('2d');

      if (stackedChartInstance.current) {
        stackedChartInstance.current.destroy();
      }

      stackedChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            {
              label: 'New',
              data: newCounts,
              backgroundColor: COLORS.new,
              borderRadius: 3,
              borderSkipped: false,
            },
            {
              label: 'Ongoing',
              data: ongoingCounts,
              backgroundColor: COLORS.ongoing,
              borderRadius: 3,
              borderSkipped: false,
            },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.4,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`;
                }
              }
            },
            datalabels: {
              display: function (ctx) {
                const value = ctx.dataset.data[ctx.dataIndex];
                if (!value || value <= 0) return false;
                const meta = ctx.chart.getDatasetMeta(ctx.datasetIndex);
                const bar = meta.data[ctx.dataIndex];
                if (!bar) return false;
                const props = bar.getProps(['x', 'y', 'base', 'width'], true);
                const segmentHeightPx = Math.abs(props.base - props.y);
                return segmentHeightPx >= 20;
              },
              formatter: function (value) {
                return value > 0 ? value.toLocaleString() : '';
              },
              color: '#fff',
              font: { family: "'DM Sans', sans-serif", size: 11, weight: '600' },
              textAlign: 'center',
              anchor: 'center',
              align: 'center',
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { family: "'DM Sans', sans-serif", size: 12 } }
            },
            y: {
              stacked: true,
              ticks: { font: { family: "'DM Sans', sans-serif", size: 11 } },
              grid: { color: '#f3f4f6' }
            }
          }
        }
      });
    }
  }, [filteredData]);

  useEffect(() => {
    if (donutChartRef.current && filteredData.length > 0) {
      const newCount = new Set(filteredData.filter(r => r.thread_start === 'TRUE').map(r => r.unique_id)).size;
      const ongoingCount = new Set(filteredData.filter(r => r.thread_start === 'FALSE').map(r => r.unique_id)).size;

      const ctx = donutChartRef.current.getContext('2d');

      if (donutChartInstance.current) {
        donutChartInstance.current.destroy();
      }

      donutChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['New', 'Ongoing'],
          datasets: [{
            data: [newCount, ongoingCount],
            backgroundColor: [COLORS.new, COLORS.ongoing],
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: 3,
            hoverOffset: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '65%',
          plugins: {
            legend: { display: false },
            datalabels: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = newCount + ongoingCount;
                  return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
                }
              }
            }
          }
        }
      });
    }
  }, [filteredData]);

  // ─── PC Table ────────────────────────────────────────────────────────────────

  const pcTableData = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      if (!map[r.pc_name]) {
        map[r.pc_name] = {
          pc_name: r.pc_name,
          pc_acronym: r.pc_acronym,
          uids: new Set(),
          new_uids: new Set(),
          ongoing_uids: new Set()
        };
      }
      map[r.pc_name].uids.add(r.unique_id);
      if (r.thread_start === 'TRUE') map[r.pc_name].new_uids.add(r.unique_id);
      else map[r.pc_name].ongoing_uids.add(r.unique_id);
    });

    const rows = Object.values(map).map(m => ({
      pc_name: m.pc_name,
      pc_acronym: m.pc_acronym,
      total: m.uids.size,
      new_count: m.new_uids.size,
      ongoing_count: m.ongoing_uids.size,
      new_pct: m.uids.size ? (m.new_uids.size / m.uids.size * 100) : 0,
      ongoing_pct: m.uids.size ? (m.ongoing_uids.size / m.uids.size * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    const maxTotal = Math.max(...rows.map(r => r.total), 1);
    return { rows, maxTotal };
  }, [filteredData]);

  // ─── Thread Table ────────────────────────────────────────────────────────────

  const threadTableData = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      if (!map[r.thread_id]) {
        map[r.thread_id] = {
          thread_id: r.thread_id,
          summary: r.summary || '',
          uids: new Set(),
          scores: [],
          high_conf: 0,
          ongoing_count: 0
        };
      }
      map[r.thread_id].uids.add(r.unique_id);
      if (r.thread_start === 'FALSE') {
        map[r.thread_id].ongoing_count++;
        const s = parseFloat(r.similarity_score);
        if (!isNaN(s)) map[r.thread_id].scores.push(s);
        if (r.confidence === 'High') map[r.thread_id].high_conf++;
      }
    });

    const rows = Object.values(map).map(m => ({
      thread_id: m.thread_id,
      summary: m.summary,
      total: m.uids.size,
      avg_score: m.scores.length ? (m.scores.reduce((a, b) => a + b, 0) / m.scores.length) : null,
      high_pct: m.ongoing_count ? (m.high_conf / m.ongoing_count * 100) : null,
      ongoing_count: m.ongoing_count,
    })).filter(r => r.total >= 2).sort((a, b) => b.total - a.total);

    return rows;
  }, [filteredData]);

  // ─── Pagination helpers ──────────────────────────────────────────────────────

  const renderPagination = (total, current, pageSize, onPageChange) => {
    const totalPages = Math.ceil(total / pageSize);
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const set = new Set([1, totalPages, current, current - 1, current + 1].filter(p => p >= 1 && p <= totalPages));
      pages.push(...[...set].sort((a, b) => a - b));
    }

    return (
      <div className="pagination">
        <div className="page-btns">
          <button
            className="page-btn"
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
          >
            ‹
          </button>
          {pages.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && p - pages[i - 1] > 1 && <span style={{ padding: '0 4px', color: 'var(--gray-400)' }}>…</span>}
              <button
                className={`page-btn ${p === current ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </Fragment>
          ))}
          <button
            className="page-btn"
            disabled={current === totalPages}
            onClick={() => onPageChange(current + 1)}
          >
            ›
          </button>
        </div>
        <span>
          {Math.min((current - 1) * pageSize + 1, total)}–{Math.min(current * pageSize, total)} of {total.toLocaleString()}
        </span>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="brrr-dashboard">
        <PMHeader />
        <PMTabs active="brrr" />
        <Container fluid>
          <div className="loading-state">Loading BRRR data...</div>
        </Container>
      </div>
    );
  }

  const threadTablePage = threadTableData.slice((threadPage - 1) * THREAD_PAGE_SIZE, threadPage * THREAD_PAGE_SIZE);
  const detailTablePage = filteredData.slice((detailPage - 1) * DETAIL_PAGE_SIZE, detailPage * DETAIL_PAGE_SIZE);

  const newCount = new Set(filteredData.filter(r => r.thread_start === 'TRUE').map(r => r.unique_id)).size;
  const ongoingCount = new Set(filteredData.filter(r => r.thread_start === 'FALSE').map(r => r.unique_id)).size;
  const total = newCount + ongoingCount;

  return (
    <div className="brrr-dashboard">
      <PMHeader />
      <PMTabs active="brrr" />

      <Container fluid className="pt-4">
        <Row>
          <Col>
            <h1>BRRR Recommendation Threads</h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <p className="page-subtitle">
              AI-assisted analysis of recurring recommendations across Budget Review &amp; Recommendations Reports (BRRRs), tracking ongoing themes over time.
            </p>
          </Col>
        </Row>
      </Container>

      <Container fluid className="dashboard-nav mt-3 py-3 mb-3">
        <Row className="align-items-center">
          <Col xs="auto" className="d-flex align-items-center">
            <span className="form-label me-2">Cluster:</span>
          </Col>
          <Col xs="auto">
            <Dropdown className="dropdown-select">
              <Dropdown.Toggle>
                <Row>
                  <Col>{filterCluster || "All clusters"}</Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Col>
                </Row>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setFilterCluster(""); setThreadPage(1); setDetailPage(1); }}>All clusters</Dropdown.Item>
                {filterOptions.clusters.map(c => (
                  <Dropdown.Item key={c} onClick={() => { setFilterCluster(c); setThreadPage(1); setDetailPage(1); }}>
                    {c}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <span className="form-label me-2">Committee:</span>
          </Col>
          <Col xs="auto">
            <Dropdown className="dropdown-select">
              <Dropdown.Toggle>
                <Row>
                  <Col>{filterPC || "All committees"}</Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Col>
                </Row>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setFilterPC(""); setThreadPage(1); setDetailPage(1); }}>All committees</Dropdown.Item>
                {filterOptions.pcs.map(pc => (
                  <Dropdown.Item key={pc} onClick={() => { setFilterPC(pc); setThreadPage(1); setDetailPage(1); }}>
                    {pc}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <span className="form-label me-2">Year:</span>
          </Col>
          <Col xs="auto">
            <Dropdown className="dropdown-select">
              <Dropdown.Toggle>
                <Row>
                  <Col>{filterYear || "All years"}</Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Col>
                </Row>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setFilterYear(""); setThreadPage(1); setDetailPage(1); }}>All years</Dropdown.Item>
                {filterOptions.years.map(y => (
                  <Dropdown.Item key={y} onClick={() => { setFilterYear(y); setThreadPage(1); setDetailPage(1); }}>
                    {y}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <span className="form-label me-2">Thread:</span>
          </Col>
          <Col xs="auto">
            <Dropdown className="dropdown-select">
              <Dropdown.Toggle>
                <Row>
                  <Col>{filterThread || "All threads"}</Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Col>
                </Row>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setFilterThread(""); setThreadPage(1); setDetailPage(1); }}>All threads</Dropdown.Item>
                {filterOptions.threads.map(t => (
                  <Dropdown.Item key={t.value} onClick={() => { setFilterThread(t.value); setThreadPage(1); setDetailPage(1); }}>
                    {t.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <span className="form-label me-2">Entity:</span>
          </Col>
          <Col xs="auto">
            <Dropdown className="dropdown-select">
              <Dropdown.Toggle>
                <Row>
                  <Col>{filterEntity || "All entities"}</Col>
                  <Col xs="auto">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Col>
                </Row>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setFilterEntity(""); setThreadPage(1); setDetailPage(1); }}>All entities</Dropdown.Item>
                {filterOptions.entities.map(e => (
                  <Dropdown.Item key={e.value} onClick={() => { setFilterEntity(e.value); setThreadPage(1); setDetailPage(1); }}>
                    {e.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto" style={{ flexGrow: 1, maxWidth: '200px' }}>
            <input
              className="filter-input"
              type="text"
              placeholder="Search text…"
              value={filterText}
              onChange={e => { setFilterText(e.target.value); setThreadPage(1); setDetailPage(1); }}
            />
          </Col>
          <Col xs="auto">
            <button className="btn-reset" onClick={resetFilters}>↺ Reset</button>
          </Col>
          <Col xs="auto">
            <div className="filter-count">
              Showing <strong>{filteredData.length.toLocaleString()}</strong> recommendations
            </div>
          </Col>
        </Row>
      </Container>

      <Container fluid className="pb-4">
          {/* SCORECARDS */}
          <div className="scorecards">
            <div className="scorecard dashboard-card">
              <div className="sc-label">Unique Threads</div>
              <div className="sc-value">{scorecards.uniqueThreads.toLocaleString()}</div>
              <div className="sc-sub">distinct recommendation threads</div>
            </div>
            <div className="scorecard dashboard-card">
              <div className="sc-label">Total Recommendations</div>
              <div className="sc-value">{scorecards.totalRecs.toLocaleString()}</div>
              <div className="sc-sub">unique recommendations tracked</div>
            </div>
            <div className="scorecard dashboard-card">
              <div className="sc-label">Avg. Similarity Score</div>
              <div
                className="sc-value"
                style={{
                  color: scorecards.avgScore !== '—'
                    ? scorecards.avgScoreNum >= 75 ? '#276220'
                      : scorecards.avgScoreNum >= 50 ? '#f97316'
                        : '#dc2626'
                    : undefined
                }}
              >
                {scorecards.avgScore}
              </div>
              <div className="sc-sub">among ongoing recommendations</div>
            </div>
            <div className="scorecard dashboard-card">
              <div className="sc-label">High Confidence Matches</div>
              <div
                className="sc-value"
                style={{
                  color: scorecards.highPct !== '—'
                    ? scorecards.highPctNum >= 75 ? '#276220'
                      : scorecards.highPctNum >= 50 ? '#f97316'
                        : '#dc2626'
                    : undefined
                }}
              >
                {scorecards.highPct}
              </div>
              <div className="sc-sub">of ongoing recs matched with high confidence</div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="section-header mt-4">
            <div className="section-header-img-wrap">
              <div className="header-bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80')" }}></div>
              <h2>New vs. Ongoing Recommendations</h2>
            </div>
            <p className="section-intro">
              How recommendations split between new threads beginning each year and ongoing threads carried forward from prior BRRRs.
            </p>
          </div>

          <div className="grid-65-35 mt-4" style={{ alignItems: 'stretch' }}>
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3>New vs. Ongoing Recommendations by Year</h3>
              <div className="card-meta">Count of distinct recommendations per year</div>
              <div className="chart-wrap" style={{ flex: 1 }}>
                <canvas ref={stackedChartRef}></canvas>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS.new }}></div>New
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS.ongoing }}></div>Ongoing
                </div>
              </div>
            </div>
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3>Share of New vs. Ongoing (All Years)</h3>
              <div className="card-meta">Count of distinct recommendations</div>
              <div className="chart-wrap chart-wrap-donut" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                <canvas ref={donutChartRef} style={{ maxHeight: '200px', maxWidth: '200px' }}></canvas>
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: COLORS.new }}></div>
                    New: {newCount.toLocaleString()} ({total ? ((newCount / total) * 100).toFixed(1) : 0}%)
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: COLORS.ongoing }}></div>
                    Ongoing: {ongoingCount.toLocaleString()} ({total ? ((ongoingCount / total) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE 1: PC TABLE */}
          <div className="section-header mt-4">
            <div className="section-header-img-wrap">
              <div className="header-bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80')" }}></div>
              <h2>By Portfolio Committee</h2>
            </div>
            <p className="section-intro">
              How are recommendations distributed across parliamentary portfolio committees? Explore the breakdown of total, new, and ongoing recommendations per committee.
            </p>
          </div>
          
          <div className="dashboard-card mt-4">
            <h3>Number of Total, New &amp; Ongoing Recs per Portfolio Committee</h3>
            <div className="card-meta">Based on filtered selection</div>
            <div className="scroll-area">
              <table>
                <colgroup>
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '180px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Portfolio Committee</th>
                    <th style={{ textAlign: 'left' }}>Total Recs</th>
                    <th style={{ textAlign: 'left' }}>New Recs</th>
                    <th style={{ textAlign: 'left' }}>Ongoing Recs</th>
                  </tr>
                </thead>
                <tbody>
                  {pcTableData.rows.map(r => (
                    <tr key={r.pc_name}>
                      <td style={{ textAlign: 'left' }}>
                        {r.pc_name} <span style={{ color: '#999' }}>&nbsp;&nbsp;[<span className="mono">{r.pc_acronym}</span>]</span>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ minWidth: '40px', fontVariantNumeric: 'tabular-nums' }}>{r.total.toLocaleString()}</span>
                          <div className="card-bar" style={{ flex: 1, transform: 'none' }}>
                            <div className="card-bar-fill" style={{ width: `${(r.total / pcTableData.maxTotal * 100).toFixed(1)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ minWidth: '40px', display: 'inline-block' }}>{r.new_count.toLocaleString()}</span>{' '}
                        <span style={{ color: '#999' }}>({r.new_pct.toFixed(1)}%)</span>
                      </td>
                      <td style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ minWidth: '40px', display: 'inline-block' }}>{r.ongoing_count.toLocaleString()}</span>{' '}
                        <span style={{ color: '#999' }}>({r.ongoing_pct.toFixed(1)}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: THREAD TABLE */}
          <div className="section-header mt-4">
            <div className="section-header-img-wrap">
              <div className="header-bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80')" }}></div>
              <h2>By Thread</h2>
            </div>
            <p className="section-intro">
              Each thread represents a recurring recommendation topic that has appeared across multiple BRRRs. Explore threads by size, similarity score, and confidence of matching.
            </p>
          </div>
          
          <div className="dashboard-card mt-4">
            <h3>Number of Total Recs per Thread ID</h3>
            <div className="card-meta">Each thread represents a recurring recommendation topic</div>
            <div className="scroll-area">
              <table>
                <colgroup>
                  <col style={{ width: '140px' }} />
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '150px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Thread ID</th>
                    <th style={{ textAlign: 'left' }}>Summary</th>
                    <th style={{ textAlign: 'left' }}>Total Recs</th>
                    <th style={{ textAlign: 'left' }}>Avg. Similarity Score</th>
                    <th style={{ textAlign: 'left' }}>% High Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {threadTablePage.map(r => (
                    <tr key={r.thread_id}>
                      <td><span className="mono">{r.thread_id}</span></td>
                      <td style={{ textAlign: 'left', fontSize: '12px', color: '#333', whiteSpace: 'normal', lineHeight: 1.5 }}>
                        {r.summary || '—'}
                      </td>
                      <td style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>{r.total.toLocaleString()}</td>
                      <td style={{ textAlign: 'left' }}>{r.avg_score !== null ? r.avg_score.toFixed(1) : '—'}</td>
                      <td style={{ textAlign: 'left' }}>{r.high_pct !== null ? r.high_pct.toFixed(1) + '%' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(threadTableData.length, threadPage, THREAD_PAGE_SIZE, setThreadPage)}
          </div>

          {/* TABLE 3: DETAIL TABLE */}
          <div className="section-header mt-4">
            <div className="section-header-img-wrap">
              <div className="header-bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80')" }}></div>
              <h2>Recommendation Details</h2>
            </div>
            <p className="section-intro">
              A full record-level view of all recommendations matching your current filters. Inspect individual recommendations, their thread assignments, similarity scores, and confidence ratings.
            </p>
          </div>
          
          <div className="dashboard-card mt-4">
            <h3>Details on Threads &amp; Recommendations</h3>
            <div className="card-meta">Full record-level view — all filtered recommendations</div>
            <div className="scroll-area tall">
              <table>
                <thead>
                  <tr>
                    <th>Thread ID</th>
                    <th>Year</th>
                    <th>Rec ID</th>
                    <th>PC</th>
                    <th>Recommendation</th>
                    <th>New?</th>
                    <th>Matches</th>
                    <th>Similarity</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTablePage.map(r => (
                    <tr key={r.unique_id}>
                      <td><span className="mono" style={{ fontSize: '10px' }}>{r.thread_id}</span></td>
                      <td>{r.year}</td>
                      <td><span className="mono" style={{ fontSize: '10px' }}>{r.unique_id}</span></td>
                      <td><strong>{r.pc_acronym}</strong></td>
                      <td className="text-cell">
                        <span title={r.raw_text}>{r.raw_text}</span>
                      </td>
                      <td>
                        {r.thread_start === 'TRUE' ? (
                          <span className="chip chip-new">New</span>
                        ) : (
                          <span className="chip chip-ongoing">Ongoing</span>
                        )}
                      </td>
                      <td><span className="mono" style={{ fontSize: '10px' }}>{r.matched_to_id || '—'}</span></td>
                      <td>
                        {r.similarity && (
                          <span className={`chip chip-${r.similarity.toLowerCase()}`}>{r.similarity}</span>
                        )}
                        {!r.similarity && <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>{r.similarity_score || '—'}</td>
                      <td>
                        {r.confidence && (
                          <span className={`chip chip-${r.confidence.toLowerCase()}`}>{r.confidence}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(filteredData.length, detailPage, DETAIL_PAGE_SIZE, setDetailPage)}
          </div>

          {/* NOTICE */}
          <div className="notice">
            <span className="notice-icon">⚠</span>
            <div>
              <strong>About this data</strong> — Recommendations are drawn from Budget Review &amp; Recommendations Reports (BRRRs) across parliamentary portfolio committees. AI-assisted similarity matching was used to identify recurring recommendation threads across years. Similarity scores and confidence labels reflect the quality of the match between an ongoing recommendation and its thread origin. Note that this dataset does not currently include data on whether recommendations have been responded to by Ministers; this will be incorporated at a later stage.
            </div>
          </div>
      </Container>
    </div>
  );
}

export default BRRRDashboard;
