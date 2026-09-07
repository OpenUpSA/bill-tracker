# Data Update Procedure

This document describes how to update the attendance and questions data for the bill-tracker.

## Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL database access (PMG)
- `.env` file in project root with:
  ```
  DATABASE_URL=postgresql://pmg:PASSWORD@pmg-db-rds-postgres13.cr0mcc4wc237.af-south-1.rds.amazonaws.com:5432/pmg
  ```

---

## 1. Export `meetings.csv` from Metabase (or automate it)

> **Automated alternative:** `update-attendance-data.js` (step 3 below) now queries the meetings data **directly from the database**, so the manual Metabase download described in this step is no longer required. It generates `data/meetings.csv` and then runs the `process-meetings.js` logic (step 2) automatically to produce `src/data/attendance.csv`. You can skip steps 1–2 and just run step 3.

To export manually (optional), use the query below and save it as `data/meetings.csv`.

> **Metabase query — Meeting Attendance Export:**
```sql
SELECT
  "public"."committee_meeting_attendance"."id" AS "id",
  "public"."committee_meeting_attendance"."chairperson" AS "chairperson",
  "public"."committee_meeting_attendance"."meeting_id" AS "meeting_id",
  "public"."committee_meeting_attendance"."member_id" AS "member_id",
  "public"."committee_meeting_attendance"."alternate_member" AS "alternate_member",
  "public"."committee_meeting_attendance"."attendance" AS "attendance",
  "public"."committee_meeting_attendance"."created_at" AS "created_at",
  "public"."committee_meeting_attendance"."updated_at" AS "updated_at",
  "Event - Meeting"."id" AS "Event - Meeting__id",
  "Event - Meeting"."date" AS "Event - Meeting__date",
  "Event - Meeting"."title" AS "Event - Meeting__title",
  "Event - Meeting"."type" AS "Event - Meeting__type",
  "Event - Meeting"."member_id" AS "Event - Meeting__member_id",
  "Event - Meeting"."committee_id" AS "Event - Meeting__committee_id",
  "Event - Meeting"."house_id" AS "Event - Meeting__house_id",
  "Event - Meeting"."chairperson" AS "Event - Meeting__chairperson",
  "Event - Meeting"."nid" AS "Event - Meeting__nid",
  "Event - Meeting"."featured" AS "Event - Meeting__featured",
  "Event - Meeting"."public_participation" AS "Event - Meeting__public_participation",
  "Event - Meeting"."body" AS "Event - Meeting__body",
  "Event - Meeting"."summary" AS "Event - Meeting__summary",
  "Event - Meeting"."actual_end_time" AS "Event - Meeting__actual_end_time",
  "Event - Meeting"."actual_start_time" AS "Event - Meeting__actual_start_time",
  "Event - Meeting"."pmg_monitor" AS "Event - Meeting__pmg_monitor",
  "Event - Meeting"."created_at" AS "Event - Meeting__created_at",
  "Event - Meeting"."updated_at" AS "Event - Meeting__updated_at",
  "Event - Meeting"."scheduled_end_time" AS "Event - Meeting__scheduled_end_time",
  "Event - Meeting"."scheduled_start_time" AS "Event - Meeting__scheduled_start_time",
  "Committee"."id" AS "Committee__id",
  "Committee"."name" AS "Committee__name",
  "Committee"."about" AS "Committee__about",
  "Committee"."contact_details" AS "Committee__contact_details",
  "Committee"."ad_hoc" AS "Committee__ad_hoc",
  "Committee"."house_id" AS "Committee__house_id",
  "Committee"."premium" AS "Committee__premium",
  "Committee"."minister_id" AS "Committee__minister_id",
  "Committee"."created_at" AS "Committee__created_at",
  "Committee"."updated_at" AS "Committee__updated_at",
  "Committee"."active" AS "Committee__active",
  "Committee"."last_active_year" AS "Committee__last_active_year",
  "Committee"."monitored" AS "Committee__monitored",
  "Member"."id" AS "Member__id",
  "Member"."name" AS "Member__name",
  "Member"."profile_pic_url" AS "Member__profile_pic_url",
  "Member"."bio" AS "Member__bio",
  "Member"."house_id" AS "Member__house_id",
  "Member"."party_id" AS "Member__party_id",
  "Member"."province_id" AS "Member__province_id",
  "Member"."start_date" AS "Member__start_date",
  "Member"."pa_link" AS "Member__pa_link",
  "Member"."current" AS "Member__current",
  "Member"."created_at" AS "Member__created_at",
  "Member"."updated_at" AS "Member__updated_at"
FROM
  "public"."committee_meeting_attendance"
  LEFT JOIN "public"."event" AS "Event - Meeting" ON "public"."committee_meeting_attendance"."meeting_id" = "Event - Meeting"."id"
  LEFT JOIN "public"."committee" AS "Committee" ON "Event - Meeting"."committee_id" = "Committee"."id"
  LEFT JOIN "public"."member" AS "Member" ON "public"."committee_meeting_attendance"."member_id" = "Member"."id"
WHERE
  (
    "Event - Meeting"."date" >= timestamp with time zone '2024-05-20 00:00:00.000 +00:00'
  )
  AND (
    "Event - Meeting"."date" < timestamp with time zone '2026-07-01 00:00:00.000 +00:00'
  )
  AND ("Committee"."house_id" = 3)
ORDER BY
  "Event - Meeting"."date" DESC
LIMIT
  1048573
```

### Notes
- Update the date range in the `WHERE` clause as needed before exporting.
- The `house_id = 3` filter selects the NCOP house.
- This query is saved in Metabase; documented here in case of loss.

---

## 2. Run `process-meetings.js`

From the `data/` directory:

```bash
cd data
node process-meetings.js
```

This reads `meetings.csv`, applies column mappings, calculates meeting durations, and writes the processed output to `../src/data/attendance.csv`.

> **Automated alternative:** `update-attendance-data.js` (step 3) runs this logic automatically after exporting the meetings data from the DB, so this step is normally not run manually.

| Setting | Value |
|---------|-------|
| **Input** | `data/meetings.csv` |
| **Output** | `src/data/attendance.csv` |

---

## 3. Run `update-attendance-data.js`

First, set the data end date in `utils/update-attendance-data.js`:

```js
const DATA_END_DATE = '2026-08-31';   // ← set this to the last date of data
```

Then, from the project root:

```bash
node utils/update-attendance-data.js [END_DATE]
```

This connects to the PMG PostgreSQL database, and does the following automatically:

1. **Exports meetings data** (the same data as the step 1 Metabase query, filtered to `house_id = 3` and a date window of `2024-05-20` to `END_DATE`), writing it to `data/meetings.csv`.
2. **Runs the `process-meetings.js` logic** to produce `src/data/attendance.csv`.
3. **Exports the all-time attendance data** (filtered up to the cutoff date) to `data/member-attendance-all-time.csv` and `src/data/attendance/all-time.json`.
4. **Exports questions data** (`2024-05-20` to `END_DATE`) to `src/data/questions.csv` in the overview schema (`Date`, `member_id`, `Minister → ID`, `Minister → Name`).
5. **Updates the frontend data cutoff** in `src/data/data-cutoff.js` to the month/year of `END_DATE`.

| Setting | Value |
|---------|-------|
| **Input** | `DATABASE_URL` from `.env` |
| **Config** | `DATA_END_DATE` in `utils/update-attendance-data.js` (e.g. `'2026-08-31'`) |
| **Optional arg** | `END_DATE` (overrides `DATA_END_DATE`; default `2026-08-31`) — used as the end boundary for the meetings, all-time, and questions exports |
| **Output (meetings)** | `data/meetings.csv` |
| **Output (attendance)** | `src/data/attendance.csv` |
| **Output (CSV)** | `data/member-attendance-all-time.csv` |
| **Output (JSON)** | `src/data/attendance/all-time.json` |
| **Output (questions)** | `src/data/questions.csv` |
| **Output (cutoff)** | `src/data/data-cutoff.js` (month/year set from `END_DATE`) |

**Requires:** `.env` file with `DATABASE_URL` set.

> **Note:** `data/meetings.csv` (with its raw `meeting_id`, `member_id`, `attendance`, etc. columns) is written as an intermediate file. The duration calculations (`actual_length`, `scheduled_length`) still go through the shared `process-meetings.js` logic, so the output format of `src/data/attendance.csv` is unchanged.

---

## 4. Export Questions CSV (automated)

> **Automated:** `update-attendance-data.js` (step 3) now queries the questions data **directly from the database** and writes `src/data/questions.csv` with the schema the overview page expects (`Date`, `member_id`, `Minister → ID`, `Minister → Name`). No manual Metabase download is required.

To export manually (optional), use the query below and save it as `src/data/questions.csv`.

> **Metabase query — Questions Export:**
```sql
SELECT
  "public"."committee_question"."id" AS "id",
  "public"."committee_question"."question_to_name" AS "question_to_name",
  "public"."committee_question"."asked_by_member_id" AS "asked_by_member_id",
  "public"."committee_question"."date" AS "date",
  "public"."committee_question"."minister_id" AS "minister_id",
  "Minister"."id" AS "Minister__id",
  "Minister"."name" AS "Minister__name",
  "Minister"."created_at" AS "Minister__created_at",
  "Minister"."updated_at" AS "Minister__updated_at"
FROM
  "public"."committee_question"
  LEFT JOIN "public"."minister" AS "Minister" ON "public"."committee_question"."minister_id" = "Minister"."id"
WHERE
  "public"."committee_question"."date" BETWEEN date '2024-05-20'
  AND date '2026-06-30'
ORDER BY
  "public"."committee_question"."date" DESC
LIMIT
  1048575
```

### Notes
- Update the date range in the `WHERE` clause as needed before exporting.
- Save the exported CSV to `src/data/questions.csv`.

---

## 5. Data cutoff date

The frontend "Data till" date is **updated automatically** by `update-attendance-data.js` (step 3): it sets `DATA_CUTOFF_MONTH` / `DATA_CUTOFF_YEAR` in `src/data/data-cutoff.js` to the month/year of the end date you specified. No manual editing is normally required.

All date references in the app are driven by a single config file:

**`src/data/data-cutoff.js`**

```js
export const DATA_CUTOFF_MONTH = 8;   // 1–12
export const DATA_CUTOFF_YEAR = 2026;
```

If you need to override it manually, update these two values to match the last month of data in the export. The following are updated automatically:

- **`src/components/overview/index.js`** — default `selectedMonth`/`selectedYear` state and the "Data till" badge
- **`src/components/attendance/index.js`** — the "Data till" badge

The badge label (e.g. "31 August 2026") is generated from the month/year — the day is computed as the last calendar day of the month.