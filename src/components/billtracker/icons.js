import "./icons.scss";

export function BillCommenced () {
  return (
    <div className="bill-status-icon bill-commenced">
        <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.69075 1.44455L8.35742 5.00011M8.35742 5.00011L0.357422 5.00011M8.35742 5.00011L5.69076 8.55566" stroke="white" stroke-width="2"/>
        </svg>
    </div>
  );
}

export function BillRevised () {
  return (
    <div className="bill-status-icon bill-revised">
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.87842 0.809812L3.73633 4.9519L4.97069 6.18627L9.11256 2.0444L10.2522 3.18403L6.11032 7.3259L7.33942 8.55499L11.4815 4.4129L7.87842 0.809812Z" fill="white"/>
            <path d="M2.17872 10.1235L6.13829 9.12102L3.18124 6.16398L2.17872 10.1235Z" fill="white"/>
        </svg>
    </div>
  );
}

export function BillWithdrawn () {
  return (
    <div className="bill-status-icon bill-withdrawn">
        <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.55545 5.889L4.99989 8.55566M4.99989 8.55566V0.555664M4.99989 8.55566L1.44434 5.889" stroke="white" stroke-width="2"/>
        </svg>

    </div>
  );
}

export function BillRejected () {
  return (
    <div className="bill-status-icon bill-rejected">
        <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5L8.5 8.5" stroke="white" stroke-width="2"/>
            <path d="M8.5 1.5L1.5 8.5" stroke="white" stroke-width="2"/>
        </svg>
    </div>
  );
}

export function BillPassed () {
    return (
        <div className="bill-status-icon bill-passed">
            <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 5L4.5 8L8.5 2" stroke="white" stroke-width="2"/>
            </svg>
        </div>
    );
}

export function ActCommenced () {
    return (
        <div className="bill-status-icon act-commenced">
            <svg viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.99957 0.95752L6.13169 4.44183H9.7953L6.83137 6.59524L7.96349 10.0796L4.99957 7.92613L2.03564 10.0796L3.16776 6.59524L0.20383 4.44183H3.86745L4.99957 0.95752Z" fill="white"/>
            </svg>
        </div>
    );
}


