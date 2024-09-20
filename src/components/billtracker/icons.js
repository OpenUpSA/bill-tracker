import "./icons.scss";

export function BillCommenced() {
	return (
		<div className="bill-status-icon bill-commenced">
			<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M5.69075 1.44455L8.35742 5.00011M8.35742 5.00011L0.357422 5.00011M8.35742 5.00011L5.69076 8.55566" stroke="white" strokeWidth="2" />
			</svg>
		</div>
	);
}

export function BillRevised() {
	return (
		<div className="bill-status-icon bill-revised">
			<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fillRule="evenodd" clipRule="evenodd" d="M7.87842 0.809812L3.73633 4.9519L4.97069 6.18627L9.11256 2.0444L10.2522 3.18403L6.11032 7.3259L7.33942 8.55499L11.4815 4.4129L7.87842 0.809812Z" fill="white" />
				<path d="M2.17872 10.1235L6.13829 9.12102L3.18124 6.16398L2.17872 10.1235Z" fill="white" />
			</svg>
		</div>
	);
}

export function BillWithdrawn() {
	return (
		<div className="bill-status-icon bill-withdrawn">
			<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8.55545 5.889L4.99989 8.55566M4.99989 8.55566V0.555664M4.99989 8.55566L1.44434 5.889" stroke="white" strokeWidth="2" />
			</svg>

		</div>
	);
}

export function BillRejected() {
	return (
		<div className="bill-status-icon bill-rejected">
			<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1.5 1.5L8.5 8.5" stroke="white" strokeWidth="2" />
				<path d="M8.5 1.5L1.5 8.5" stroke="white" strokeWidth="2" />
			</svg>
		</div>
	);
}

export function BillPassed() {
	return (
		<div className="bill-status-icon bill-passed">
			<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1.5 5L4.5 8L8.5 2" stroke="white" strokeWidth="2" />
			</svg>
		</div>
	);
}

export function ActCommenced() {
	return (
		<div className="bill-status-icon act-commenced">
			<svg viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M4.99957 0.95752L6.13169 4.44183H9.7953L6.83137 6.59524L7.96349 10.0796L4.99957 7.92613L2.03564 10.0796L3.16776 6.59524L0.20383 4.44183H3.86745L4.99957 0.95752Z" fill="white" />
			</svg>
		</div>
	);
}

export function IconZoomIn() {
	return (
		<div className="circle-icon zoom-in">
			<div>+</div>
		</div>
	);
}

export function IconZoomOut() {
	return (
		<div className="circle-icon zoom-out">
			<div>-</div>
		</div>
	);
}

export function IconFullscreen() {
	return (
		<div className="circle-icon fullscreen">
			<div>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M3.125 0.875C3.45703 0.875 3.75 1.16797 3.75 1.5C3.75 1.85156 3.45703 2.125 3.125 2.125H1.875V3.375C1.875 3.72656 1.58203 4 1.25 4C0.898438 4 0.625 3.72656 0.625 3.375V1.5C0.625 1.16797 0.898438 0.875 1.25 0.875H3.125ZM8.75 0.875C9.08203 0.875 9.375 1.16797 9.375 1.5V3.375C9.375 3.72656 9.08203 4 8.75 4C8.39844 4 8.125 3.72656 8.125 3.375V2.125H6.875C6.52344 2.125 6.25 1.85156 6.25 1.5C6.25 1.16797 6.52344 0.875 6.875 0.875H8.75ZM3.125 8.375C3.45703 8.375 3.75 8.66797 3.75 9C3.75 9.35156 3.45703 9.625 3.125 9.625H1.25C0.898438 9.625 0.625 9.35156 0.625 9V7.125C0.625 6.79297 0.898438 6.5 1.25 6.5C1.58203 6.5 1.875 6.79297 1.875 7.125V8.375H3.125ZM8.75 6.5C9.08203 6.5 9.375 6.79297 9.375 7.125V9C9.375 9.35156 9.08203 9.625 8.75 9.625H6.875C6.52344 9.625 6.25 9.35156 6.25 9C6.25 8.66797 6.52344 8.375 6.875 8.375H8.125V7.125C8.125 6.79297 8.39844 6.5 8.75 6.5Z" fill="#575757"/>
				</svg>
			</div>
		</div>
	);
}

export function IconReset() {
	return (
		<div className="circle-icon reset">
			<div>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9.375 5.25C9.375 7.67188 7.40234 9.625 5 9.625C4.04297 9.625 3.125 9.33203 2.36328 8.76562C2.08984 8.55078 2.03125 8.16016 2.24609 7.88672C2.46094 7.61328 2.85156 7.55469 3.125 7.75C3.67188 8.16016 4.31641 8.375 5 8.375C6.71875 8.375 8.125 6.98828 8.125 5.25C8.125 3.53125 6.71875 2.14453 5 2.14453C4.25781 2.14453 3.57422 2.39844 3.00781 2.84766L3.90625 3.72656C4.23828 4.05859 3.98438 4.64453 3.51562 4.64453H0.683594C0.46875 4.64453 0.3125 4.46875 0.3125 4.25391V1.42188C0.3125 0.933594 0.878906 0.699219 1.21094 1.03125L2.12891 1.96875C2.91016 1.28516 3.92578 0.894531 5 0.894531C7.40234 0.894531 9.375 2.84766 9.375 5.25Z" fill="#575757"/>
				</svg>
			</div>
		</div>
	);
}