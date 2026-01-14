/**
 * Process meetings data to create attendance CSV with time calculations
 * 
 * This script combines the logic from both Jupyter notebooks into a single
 * JavaScript solution that processes meeting data and generates the final
 * attendance.csv file structure.
 * 
 * Usage: node process-meetings.js [input-file] [output-file]
 * 
 * @author OpenUp SA
 * @date 2026-01-14
 */

const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
// Modify these paths as needed
const DEFAULT_INPUT_FILE = './meetings.csv';
const DEFAULT_OUTPUT_FILE = '../src/data/attendance.csv';

/**
 * Parse CSV content into array of objects
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} Array of objects with CSV data
 */
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        // Handle CSV parsing with quoted values containing commas
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        // Create object from headers and values
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        
        return obj;
    });
}

/**
 * Convert CSV array back to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column names in desired order
 * @returns {string} CSV formatted string
 */
function arrayToCSV(data, columns) {
    const header = columns.join(',');
    const rows = data.map(row => {
        return columns.map(col => {
            const value = row[col] || '';
            // Escape values containing commas or quotes
            if (value.toString().includes(',') || value.toString().includes('"')) {
                return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [header, ...rows].join('\n');
}

/**
 * Parse time string in various formats to minutes from midnight
 * Handles both "HH:MM" and "HH:MM AM/PM" formats
 * 
 * MODIFY THIS FUNCTION to handle different time formats
 * 
 * @param {string} timeStr - Time string to parse
 * @returns {number|null} Minutes from midnight or null if invalid
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr || timeStr.trim() === '') return null;
    
    timeStr = timeStr.trim();
    
    // Handle HH:MM AM/PM format
    const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (amPmMatch) {
        let hours = parseInt(amPmMatch[1]);
        const minutes = parseInt(amPmMatch[2]);
        const ampm = amPmMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    }
    
    // Handle HH:MM 24-hour format
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        return hours * 60 + minutes;
    }
    
    console.warn(`Warning: Could not parse time "${timeStr}"`);
    return null;
}

/**
 * Convert minutes from midnight back to HH:MM format
 * @param {number|null} minutes - Minutes from midnight
 * @returns {string} Time in HH:MM format or empty string
 */
function minutesToTimeString(minutes) {
    if (minutes === null || minutes === undefined) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate meeting durations with fallback logic
 * 
 * This function implements the business logic for duration calculation:
 * 1. Try to calculate from actual times
 * 2. Fall back to scheduled times if actual not available  
 * 3. Use default of 60 minutes if nothing available
 * 
 * MODIFY THIS FUNCTION to change duration calculation logic
 * 
 * @param {Object} row - Meeting data row
 * @returns {Object} Object with actual_length and scheduled_length
 */
function calculateDurations(row) {
    // Parse all time values to minutes
    const actualStart = parseTimeToMinutes(row.actual_start_time);
    const actualEnd = parseTimeToMinutes(row.actual_end_time);
    const scheduledStart = parseTimeToMinutes(row.scheduled_start_time);
    const scheduledEnd = parseTimeToMinutes(row.scheduled_end_time);
    
    // Helper function to calculate duration
    const calculateMinutes = (start, end) => {
        if (start === null || end === null) return null;
        const duration = end - start;
        return duration >= 0 ? duration : null; // Handle negative durations
    };
    
    // ===== ACTUAL LENGTH CALCULATION =====
    // Priority: actual times > scheduled times > default 60 min
    let actualLength = calculateMinutes(actualStart, actualEnd);
    
    if (actualLength === null) {
        // Fall back to scheduled times
        actualLength = calculateMinutes(scheduledStart, scheduledEnd);
    }
    
    if (actualLength === null) {
        // Default fallback
        actualLength = 60;
    }
    
    // ===== SCHEDULED LENGTH CALCULATION =====
    // Priority: scheduled times > actual times > default 60 min
    let scheduledLength = calculateMinutes(scheduledStart, scheduledEnd);
    
    if (scheduledLength === null) {
        // Fall back to actual times
        scheduledLength = calculateMinutes(actualStart, actualEnd);
    }
    
    if (scheduledLength === null) {
        // Default fallback
        scheduledLength = 60;
    }
    
    return {
        actual_length: Math.max(0, actualLength),
        scheduled_length: Math.max(0, scheduledLength)
    };
}

/**
 * Process date string to dd-mm-yyyy format
 * MODIFY THIS FUNCTION to handle different input date formats
 * 
 * @param {string} dateStr - Input date string
 * @returns {string} Date in dd-mm-yyyy format
 */
function processDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return '';
    
    try {
        // Handle dd-mm-yyyy format (with single or double digits)
        const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (ddmmyyyyMatch) {
            const day = ddmmyyyyMatch[1].padStart(2, '0');
            const month = ddmmyyyyMatch[2].padStart(2, '0');
            const year = ddmmyyyyMatch[3];
            return `${day}-${month}-${year}`;
        }
        
        // Handle dd/mm/yyyy format
        const ddmmyyyySlashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyySlashMatch) {
            const day = ddmmyyyySlashMatch[1].padStart(2, '0');
            const month = ddmmyyyySlashMatch[2].padStart(2, '0');
            const year = ddmmyyyySlashMatch[3];
            return `${day}-${month}-${year}`;
        }
        
        // Handle yyyy-mm-dd format
        const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (yyyymmddMatch) {
            const year = yyyymmddMatch[1];
            const month = yyyymmddMatch[2].padStart(2, '0');
            const day = yyyymmddMatch[3].padStart(2, '0');
            return `${day}-${month}-${year}`;
        }
        
        // Try parsing as standard date (fallback)
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        }
        
        console.warn(`Warning: Could not parse date "${dateStr}"`);
        return dateStr; // Return original if can't parse
        
    } catch (error) {
        console.warn(`Warning: Error processing date "${dateStr}": ${error.message}`);
        return dateStr;
    }
}

/**
 * Main processing function
 * @param {string} inputFile - Path to input CSV file
 * @param {string} outputFile - Path to output CSV file
 */
function processMeetingsData(inputFile, outputFile) {
    console.log('🔄 Processing meetings data...');
    console.log(`📁 Input file: ${inputFile}`);
    console.log(`📁 Output file: ${outputFile}`);
    
    try {
        // ===== STEP 1: LOAD DATA =====
        console.log('\n📖 Loading input data...');
        const inputData = fs.readFileSync(inputFile, 'utf8');
        const rows = parseCSV(inputData);
        
        console.log(`✅ Loaded ${rows.length} rows`);
        console.log(`📋 Input columns: ${Object.keys(rows[0] || {}).join(', ')}`);
        
        if (rows.length === 0) {
            throw new Error('No data found in input file');
        }
        
        // ===== STEP 2: COLUMN MAPPING =====
        // MODIFY THIS MAPPING based on your input file structure
        const columnMapping = {
            'Meeting ID': 'meeting_id',
            'Member ID': 'member_id',
            'Attendance': 'attendance',
            'Date': 'event_date',
            'Committee ID': 'committee_id',
            'Actual End Time': 'actual_end_time',
            'Actual Start Time': 'actual_start_time',
            'Scheduled End Time': 'scheduled_end_time',
            'Scheduled Start Time': 'scheduled_start_time',
            'Party ID': 'party_id'
            // Add more mappings as needed
        };
        
        console.log('\n🔄 Applying column mappings...');
        
        // Apply column renaming
        const processedRows = rows.map(row => {
            const newRow = {};
            
            // Apply mappings and keep unmapped columns
            Object.keys(row).forEach(oldCol => {
                const newCol = columnMapping[oldCol] || oldCol.toLowerCase().replace(/\s+/g, '_');
                newRow[newCol] = row[oldCol];
            });
            
            return newRow;
        });
        
        // ===== STEP 3: DATE PROCESSING =====
        console.log('\n📅 Processing dates...');
        processedRows.forEach(row => {
            if (row.event_date) {
                row.event_date = processDate(row.event_date);
            }
        });
        
        // ===== STEP 4: TIME AND DURATION PROCESSING =====
        console.log('\n⏱️  Calculating meeting durations...');
        
        let durationCalculations = 0;
        let defaultFallbacks = 0;
        
        processedRows.forEach(row => {
            // Calculate durations
            const durations = calculateDurations(row);
            row.actual_length = durations.actual_length;
            row.scheduled_length = durations.scheduled_length;
            
            // Track statistics
            durationCalculations++;
            if (durations.actual_length === 60 && durations.scheduled_length === 60) {
                defaultFallbacks++;
            }
            
            // Format time columns back to HH:MM strings
            const timeColumns = ['actual_start_time', 'actual_end_time', 'scheduled_start_time', 'scheduled_end_time'];
            timeColumns.forEach(col => {
                if (row[col]) {
                    const minutes = parseTimeToMinutes(row[col]);
                    row[col] = minutesToTimeString(minutes);
                }
            });
        });
        
        console.log(`✅ Processed ${durationCalculations} duration calculations`);
        console.log(`⚠️  Used default 60min fallback for ${defaultFallbacks} rows`);
        
        // ===== STEP 5: ENSURE CORRECT STRUCTURE =====
        console.log('\n📋 Finalizing data structure...');
        
        // Define expected columns in attendance.csv order
        const expectedColumns = [
            'meeting_id', 'member_id', 'attendance', 'event_date', 'committee_id',
            'actual_end_time', 'actual_start_time', 'scheduled_end_time', 
            'scheduled_start_time', 'party_id', 'actual_length', 'scheduled_length'
        ];
        
        // Ensure all expected columns exist and are in correct order
        const finalRows = processedRows.map(row => {
            const finalRow = {};
            
            expectedColumns.forEach(col => {
                if (row[col] !== undefined) {
                    finalRow[col] = row[col];
                } else {
                    // Provide defaults for missing columns
                    if (['actual_length', 'scheduled_length'].includes(col)) {
                        finalRow[col] = 60; // Default duration
                    } else if (['meeting_id', 'member_id', 'committee_id', 'party_id'].includes(col)) {
                        finalRow[col] = 0; // Default ID
                    } else {
                        finalRow[col] = ''; // Default empty string
                    }
                }
            });
            
            // Convert ID and duration columns to integers
            ['meeting_id', 'member_id', 'committee_id', 'party_id', 'actual_length', 'scheduled_length'].forEach(col => {
                const value = parseInt(finalRow[col]);
                finalRow[col] = isNaN(value) ? 0 : value;
            });
            
            return finalRow;
        });
        
        // ===== STEP 6: SAVE OUTPUT =====
        console.log('\n💾 Saving output...');
        
        const outputCSV = arrayToCSV(finalRows, expectedColumns);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputFile, outputCSV, 'utf8');
        
        // ===== STEP 7: SUMMARY STATISTICS =====
        console.log('\n📊 PROCESSING SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Final data shape: ${finalRows.length} rows, ${expectedColumns.length} columns`);
        console.log(`📋 Columns: ${expectedColumns.join(', ')}`);
        
        // Duration statistics
        const actualLengths = finalRows.map(r => r.actual_length);
        const scheduledLengths = finalRows.map(r => r.scheduled_length);
        
        const avgActual = actualLengths.reduce((a, b) => a + b, 0) / actualLengths.length;
        const avgScheduled = scheduledLengths.reduce((a, b) => a + b, 0) / scheduledLengths.length;
        
        const medianActual = actualLengths.sort((a, b) => a - b)[Math.floor(actualLengths.length / 2)];
        const medianScheduled = scheduledLengths.sort((a, b) => a - b)[Math.floor(scheduledLengths.length / 2)];
        
        console.log(`\n⏱️  Duration statistics:`);
        console.log(`   Actual length   - Mean: ${avgActual.toFixed(1)} min, Median: ${medianActual} min`);
        console.log(`   Scheduled length - Mean: ${avgScheduled.toFixed(1)} min, Median: ${medianScheduled} min`);
        
        // Sample output
        console.log(`\n📋 Sample of final data:`);
        console.log('='.repeat(50));
        finalRows.slice(0, 3).forEach((row, i) => {
            console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
        });
        
        console.log(`\n✅ Success! Output saved to: ${outputFile}`);
        
        return finalRows;
        
    } catch (error) {
        console.error(`❌ Error processing data: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// ===== MAIN EXECUTION =====
if (require.main === module) {
    // Get file paths from command line arguments or use defaults
    const inputFile = process.argv[2] || DEFAULT_INPUT_FILE;
    const outputFile = process.argv[3] || DEFAULT_OUTPUT_FILE;
    
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Error: Input file "${inputFile}" not found`);
        console.log(`\n📖 Usage: node process-meetings.js [input-file] [output-file]`);
        console.log(`   Default input:  ${DEFAULT_INPUT_FILE}`);
        console.log(`   Default output: ${DEFAULT_OUTPUT_FILE}`);
        process.exit(1);
    }
    
    console.log('🚀 Starting meetings data processing...');
    processMeetingsData(inputFile, outputFile);
}

// Export functions for potential use as module
module.exports = {
    processMeetingsData,
    parseCSV,
    arrayToCSV,
    parseTimeToMinutes,
    minutesToTimeString,
    calculateDurations,
    processDate
};

// ===== CUSTOMIZATION NOTES =====
/*
TO CUSTOMIZE THIS SCRIPT FOR YOUR NEEDS:

1. COLUMN MAPPING (Line ~145):
   - Update the columnMapping object to match your input file column names
   - Add or remove mappings as needed

2. DATE FORMAT (Line ~180):
   - Modify processDate() function to handle different input date formats
   - Change output format if needed (currently dd-mm-yyyy)

3. TIME FORMAT (Line ~60):
   - Update parseTimeToMinutes() function to handle different time formats
   - Currently handles HH:MM and HH:MM AM/PM

4. DURATION LOGIC (Line ~100):
   - Modify calculateDurations() function to change business logic
   - Change fallback priorities or default values
   - Add additional validation rules

5. OUTPUT STRUCTURE (Line ~245):
   - Modify expectedColumns array to change final structure
   - Add or remove columns as needed
   - Change column ordering

6. DEFAULT VALUES (Line ~255):
   - Change default values for missing data
   - Add business-specific defaults

7. FILE PATHS (Line ~15):
   - Update DEFAULT_INPUT_FILE and DEFAULT_OUTPUT_FILE paths
   - Modify to match your project structure

USAGE EXAMPLES:
   node process-meetings.js                           # Use default paths
   node process-meetings.js meetings.csv output.csv   # Specify custom paths
   node process-meetings.js ./data/input.csv ./src/data/attendance.csv
*/