#!/usr/bin/env python3
"""
Process the PMG Questions Register Excel + PMG questions export CSV
into a consolidated questions CSV with PMG IDs.

Usage:
    python3 utils/process-questions.py <register.xlsx> <pmg-export.csv> [--out <output.csv>]

Example:
    python3 utils/process-questions.py \
        "src/data/questions/2026/REGISTER 2026 RECONSTRUCTION_cleaned.xlsx" \
        "src/data/questions/2026/questions-2026.csv" \
        --out "src/data/questions/2026/questions-2026-all.csv"

Reads the WRITTENS, ORALS, PRESIDENT, and DEPUTY PRESIDENT sheets from the
Excel workbook, combines them into one CSV, and adds a `pmg_id` column linking
each register row to a matching question in the PMG export (matched on ACC No
with trailing 'E' stripped = PMG Code, with name-based tie-breaking for
duplicates).

A `type` column records the source sheet: 'written', 'oral',
'president', or 'deputy_president'.
"""

import argparse
import csv
import re
import sys
from collections import defaultdict
from datetime import datetime, date

try:
    import openpyxl
except ImportError:
    sys.exit("Error: openpyxl is required. Install with: pip3 install openpyxl")


# ── Helpers ──────────────────────────────────────────────────────────────────

def fmt(v):
    """Format an Excel cell value for CSV output."""
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def strip_e(s):
    """Strip trailing 'E' from ACC No to match PMG Code. e.g. 'NW1E' -> 'NW1'"""
    return s[:-1] if s and s.endswith("E") else s


def norm_name(s):
    """Normalize a person's name into a set of lowercase tokens for fuzzy matching."""
    if not s:
        return set()
    s = re.sub(r"^(Dr|Mr|Ms|Mrs|Miss|Prof|Rev|Hon)\s+", "", s.strip())
    return set(re.findall(r"[A-Za-z]+", s.lower()))


def name_similarity(n1, n2):
    """Jaccard similarity of name token sets."""
    s1, s2 = norm_name(n1), norm_name(n2)
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)


# ── Sheet config ─────────────────────────────────────────────────────────────
# Each sheet has 2 title/legend rows, then the header on row 3 (0-indexed 2).
# Sheets are listed in output order.

SHEETS = [
    {"name": "WRITTENS",          "type": "written"},
    {"name": "ORALS",             "type": "oral"},
    {"name": "PRESIDENT",         "type": "president"},
    {"name": "DEPUTY PRESIDENT",  "type": "deputy_president"},
]


def read_sheet(ws):
    """Read a worksheet, returning (header_list, data_rows).

    Assumes rows 1-2 are title/legend, row 3 is the column header, and
    data starts at row 4. Trailing empty columns are trimmed.
    """
    all_rows = list(ws.iter_rows(values_only=True))
    if len(all_rows) < 3:
        return [], []

    header = [fmt(c) for c in all_rows[2]]
    while header and header[-1] == "":
        header.pop()
    ncols = len(header)

    data = []
    for r in all_rows[3:]:
        if all(c is None for c in r):
            continue
        data.append([fmt(r[i]) if i < len(r) else "" for i in range(ncols)])

    return header, data


def load_pmg(csv_path):
    """Load PMG export CSV and index by stripped Code.

    Returns dict: code -> list of PMG row dicts.
    """
    csv.field_size_limit(sys.maxsize)
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    by_key = defaultdict(list)
    for r in rows:
        code = r.get("Code", "")
        if code:
            by_key[code].append(r)
    return by_key


def match_pmg_id(acc_no, member, pmg_by_key):
    """Return the best matching PMG ID for a register row, or '' if no match."""
    key = strip_e(acc_no)
    if not key or key not in pmg_by_key:
        return ""
    candidates = pmg_by_key[key]
    if len(candidates) == 1:
        return candidates[0].get("ID", "")
    # Multiple PMG rows with same code — pick best by member name similarity
    best = max(
        candidates,
        key=lambda p: name_similarity(member, p.get("Asked By Name", "")),
    )
    return best.get("ID", "")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Convert PMG Questions Register Excel + PMG export CSV "
                    "into a consolidated questions CSV with PMG IDs."
    )
    parser.add_argument(
        "register",
        help="Path to the Register Excel file (.xlsx)",
    )
    parser.add_argument(
        "pmg_export",
        help="Path to the PMG questions export CSV",
    )
    parser.add_argument(
        "--out", "-o",
        default="questions-all.csv",
        help="Output CSV path (default: questions-all.csv)",
    )
    args = parser.parse_args()

    # Load PMG export
    print(f"Loading PMG export: {args.pmg_export}")
    pmg_by_key = load_pmg(args.pmg_export)
    print(f"  {sum(len(v) for v in pmg_by_key.values())} PMG rows, "
          f"{len(pmg_by_key)} unique codes")

    # Load workbook
    print(f"Loading register: {args.register}")
    wb = openpyxl.load_workbook(args.register, data_only=True, read_only=True)

    # Collect rows from all sheets
    # Final columns: type, <all sheet columns>, pmg_id
    # We need a unified header since sheets have different columns.
    # Strategy: use the WRITTENS header as the base, add any extra columns
    # from other sheets (e.g. CLUSTER from ORALS), and fill missing with ''.

    sheet_data = {}       # sheet_type -> (header, rows)
    all_headers_seen = []  # ordered list of all column names across sheets

    for s in SHEETS:
        if s["name"] not in wb.sheetnames:
            print(f"  ⚠️  Sheet '{s['name']}' not found, skipping")
            continue
        ws = wb[s["name"]]
        header, data = read_sheet(ws)
        sheet_data[s["type"]] = (header, data)
        print(f"  Sheet '{s['name']}': {len(data)} rows, {len(header)} cols")
        # Merge headers (preserve order, don't duplicate)
        for h in header:
            if h not in all_headers_seen:
                all_headers_seen.append(h)

    # Build unified output
    # Columns: type, <unified register columns>, pmg_id
    out_header = ["type"] + all_headers_seen + ["pmg_id"]

    out_rows = []
    stats = defaultdict(lambda: {"rows": 0, "matched": 0})

    for s in SHEETS:
        sd = sheet_data.get(s["type"])
        if not sd:
            continue
        header, data = sd
        acc_idx = header.index("ACC No") if "ACC No" in header else None
        member_idx = header.index("Member asking") if "Member asking" in header else None

        for row in data:
            acc = row[acc_idx] if acc_idx is not None else ""
            member = row[member_idx] if member_idx is not None else ""
            pmg_id = match_pmg_id(acc, member, pmg_by_key)

            # Map this row's values onto the unified header
            row_map = dict(zip(header, row))
            out_row = {"type": s["type"], "pmg_id": pmg_id}
            for h in all_headers_seen:
                out_row[h] = row_map.get(h, "")
            out_rows.append(out_row)

        stats[s["type"]]["rows"] = len(data)
        stats[s["type"]]["matched"] = sum(
            1 for r in out_rows[-len(data):] if r["pmg_id"]
        )

    # Write CSV
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=out_header, extrasaction="ignore")
        w.writeheader()
        w.writerows(out_rows)

    # Report
    print(f"\nWrote {len(out_rows)} rows to {args.out}")
    print(f"  columns: {out_header}\n")
    for s in SHEETS:
        st = stats.get(s["type"])
        if st:
            print(f"  {s['type']:20s} {st['rows']:5d} rows, {st['matched']:5d} matched PMG")
    total_matched = sum(1 for r in out_rows if r["pmg_id"])
    print(f"  {'TOTAL':20s} {len(out_rows):5d} rows, {total_matched:5d} matched PMG")


if __name__ == "__main__":
    main()
