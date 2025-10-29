import 'dotenv/config';
import { Client } from 'pg';
import fs from 'fs';
import { format } from '@fast-csv/format';

const cutoffDate = '2024-05-21';

const normalizeDate = (dateStr: string): { date: string; normalized: boolean } => {
  if (!dateStr || dateStr.trim() === '') return { date: dateStr, normalized: false };

  if (dateStr.toLowerCase() === 'future') return { date: '2029-05-20', normalized: true };

  // Handle year-only dates like 2003-00-00
  const yearOnlyMatch = dateStr.match(/^(\d{4})-00-00$/);
  if (yearOnlyMatch) {
    const [_, year] = yearOnlyMatch;
    return { date: `${year}-01-01`, normalized: true };
  }

  // Handle approximate month dates like 2015-04-00
  const approxMatch = dateStr.match(/^(\d{4})-(\d{2})-00$/);
  if (approxMatch) {
    const [_, year, month] = approxMatch;
    return { date: `${year}-${month}-01`, normalized: true };
  }

  return { date: dateStr, normalized: false };
};

// --- DB connections ---
const connectionStringPMG = process.env.PMG_DATABASE_URL;
const connectionStringPA = process.env.PA_DATABASE_URL;

if (!connectionStringPMG || !connectionStringPA) {
  console.error('❌ PMG_DATABASE_URL or PA_DATABASE_URL not set in .env file');
  process.exit(1);
}

const clientPMG = new Client({ connectionString: connectionStringPMG, ssl: { rejectUnauthorized: false } });
const clientPA = new Client({ connectionString: connectionStringPA, ssl: { rejectUnauthorized: false } });

// --- Types ---
type AttendanceRow = {
  pmg_member_id: string;
  event_date: string;
  attendance: string | null;
  member_current: boolean;
};

type MemberDetails = {
  pmg_member_id: string;
  pa_person_id: string;
  member_name: string | null;
  start_date: string | null;
  end_date: string | null;
  membership: string | null;
  organisation_name: string | null;
  organisation_kind: string | null;
};

type MappedAttendanceRow = AttendanceRow & {
  pmg_member_id: string;
  pa_person_id: string | null;
  member_name: string | null;
  party_name?: string | null;
  committee_name?: string | null;
  membership?: string | null;
  house?: string | null;
};

async function main() {
  try {
    await clientPMG.connect();
    await clientPA.connect();

    // --- Fetch attendance ---
    const queryAttendance = `
      SELECT 
        "member"."id" AS "pmg_member_id",
        "event"."date" AS "event_date",
        "public"."committee_meeting_attendance"."attendance" AS "attendance",
        "member"."current" AS "member_current"
      FROM "public"."committee_meeting_attendance"
      LEFT JOIN "public"."member" ON "committee_meeting_attendance"."member_id" = "member"."id"
      LEFT JOIN "public"."event" ON "committee_meeting_attendance"."meeting_id" = "event"."id"
      LEFT JOIN "public"."house" ON "member"."house_id" = "house"."id"
      WHERE "event"."date" >= $1
        AND "house"."name" IN ('National Assembly', 'National Council of Provinces');
    `;
    const resultAttendance = await clientPMG.query(queryAttendance, [cutoffDate]);
    const attendanceRows: AttendanceRow[] = resultAttendance.rows;
    const memberIds = Array.from(new Set(attendanceRows.map(r => r.pmg_member_id)));

    if (memberIds.length === 0) {
      console.log('No members found matching criteria.');
      return;
    }

    // --- Fetch memberships ---
    const placeholders = memberIds.map((_, i) => `$${i + 1}`).join(', ');
    const queryMemberships = `
      SELECT
        "public"."core_identifier"."identifier" AS "pmg_member_id",
        "core_person"."id" AS "pa_person_id",
        "core_person"."legal_name" AS "member_name",
        "core_position"."start_date" AS "start_date",
        "core_position"."end_date" AS "end_date",
        "core_positiontitle"."name" AS "membership",
        "core_organisation"."name" AS "organisation_name",
        "core_organisationkind"."name" AS "organisation_kind"
      FROM "public"."core_identifier"
      LEFT JOIN "public"."core_person" ON "public"."core_identifier"."object_id" = "core_person"."id"
      LEFT JOIN "public"."core_position" ON "core_person"."id" = "core_position"."person_id"
      LEFT JOIN "public"."core_positiontitle" ON "core_position"."title_id" = "core_positiontitle"."id"
      LEFT JOIN "public"."core_organisation" ON "core_position"."organisation_id" = "core_organisation"."id"
      LEFT JOIN "public"."core_organisationkind" ON "core_organisation"."kind_id" = "core_organisationkind"."id"
      WHERE "public"."core_identifier"."scheme" = 'za.org.pmg.api/member'
        AND "public"."core_identifier"."identifier" IN (${placeholders})
        AND (
          "core_organisationkind"."name" = 'National Assembly Committees' OR
          "core_organisationkind"."name" = 'NCOP Committees' OR
          "core_organisationkind"."name" = 'Party'
        )
      ORDER BY "core_position"."start_date" ASC;
    `;
    const resultMemberships = await clientPA.query(queryMemberships, memberIds);
    const memberDetails: MemberDetails[] = resultMemberships.rows;

    // --- Normalize end dates & store normalized flags ---
    const normalizedMemberships = memberDetails.map(m => {
      const start = normalizeDate(m.start_date ?? '');
      const end = normalizeDate(m.end_date ?? '');

      return {
        ...m,
        start_date_obj: start.date ? new Date(start.date) : null,
        end_date_obj: end.date ? new Date(end.date) : null,
        start_date_debug: m.start_date,
        end_date_debug: m.end_date,
        start_date_normalized: start.normalized,
        end_date_normalized: end.normalized,
      };
    });

    console.table(normalizedMemberships)

    // --- Map attendance to memberships ---
    const mappedAttendance: MappedAttendanceRow[] = attendanceRows.map(att => {
      const eventDate = new Date(att.event_date);

      const memberships = normalizedMemberships.filter(
        m =>
          m.pmg_member_id === String(att.pmg_member_id) &&
          eventDate >= (m.start_date_obj || new Date('1900-01-01')) &&
          eventDate <= (m.end_date_obj || new Date('2029-05-20'))
      );

      const party = memberships.find(m => m.organisation_kind === 'Party');
      const committee = memberships.find(m =>
        m.organisation_kind === 'National Assembly Committees' ||
        m.organisation_kind === 'NCOP Committees'
      );

      const member = memberships[0];

      // format event_date as YYYY-MM-DD HH:MM
      const formattedEventDate = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')} ${String(
        eventDate.getHours()
      ).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;

      return {
        ...att,
        pmg_member_id: member?.pmg_member_id || String(att.pmg_member_id),
        pa_person_id: member?.pa_person_id || null,
        member_name: member?.member_name || null,
        party_name: party?.organisation_name || null,
        committee_name: committee?.organisation_name || null,
        membership: committee?.membership || null,
        house: committee?.organisation_kind || null,
        event_date: formattedEventDate,
        start_date: member?.start_date_debug || null,   // original string
        end_date: member?.end_date_debug || null,       // original string
        start_date_normalized: member?.start_date_normalized || false,
        end_date_normalized: member?.end_date_normalized || false,
      };
    });

    // --- Write CSV ---
    const ws = fs.createWriteStream('attendance-with-memberships.csv');
    const csvStream = format({ headers: true });
    csvStream.pipe(ws);
    mappedAttendance.forEach(r => csvStream.write(r));
    csvStream.end();

    console.table(mappedAttendance);
    console.log('Relevant members:', memberIds.length);
    console.log('Attendance records:', attendanceRows.length);
    console.log('Membership records:', normalizedMemberships.length);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await clientPMG.end();
    await clientPA.end();
  }
}

main();
