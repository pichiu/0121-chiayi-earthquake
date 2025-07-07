# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a disaster relief data processing system for managing earthquake relief operations following the January 21 earthquake in Chiayi, Taiwan. The system handles volunteer registration, housing damage assessment, repair coordination, and logistics management.

## Development Environment

### Python Dependencies
Install required packages:
```bash
pip install -r requirements.txt
```

Required packages include Google API client libraries, pandas, openpyxl, folium, and pyproj for coordinate transformations.

### Google API Setup
- Requires `credentials.json` file with Google Service Account credentials
- Needed for Google Drive file downloads and Google Sheets automation

## Core Commands

### Data Processing Pipeline
```bash
# Download Excel files from Google Drive and convert to CSV
python gdrive.py --file_id <DRIVE_FILE_ID> --service_account_file credentials.json --excel_file_name output.xlsx --csv_file_name processed --output_folder data/

# Clean and standardize Excel data from different locations
python clean_excel.py --location 東勢里 --file data/input.xlsx --output data/cleaned_dongshi.csv
python clean_excel.py --location 玉田里 --file data/input.xlsx --output data/cleaned_yutian.csv

# Filter data by administrative regions
python split_csv.py --input data/cleaned.csv --output data/filtered.csv

# Assign cases to work teams based on neighborhood rules
python groups.py --input data/filtered.csv --output data/grouped.csv

# Generate interactive maps with coordinate conversion
python map.py --input data/grouped.csv --output maps/damage_assessment.html
```

### Google Apps Script Functions
Located in `AppScript/` directory:
- `syncAndFormatData.js` - Main data processing and volunteer management
- `backupSheetWithTimestamp.js` - Automated backup system
- `syncDiffTable.js` - Two-way sync between master and team sheets

## Architecture

### Data Flow
```
Google Drive Excel Files → CSV Extraction → Data Cleaning → 
Geographic Processing → Team Assignment → Mapping → 
Google Sheets Synchronization → Team Coordination
```

### Key Components

**Data Processing (`clean_excel.py`)**
- Handles location-specific data formats for 東勢里 and 玉田里
- Standardizes phone numbers and addresses
- Filters out completed review applications
- Manages neighborhood assignments

**Geographic Processing (`map.py`, `trans.py`)**
- Converts coordinates between TWD97 and WGS84 systems
- Creates interactive folium maps
- Processes address standardization

**Team Management (`groups.py`)**
- Assigns cases to work teams based on geographic proximity
- Manages volunteer coordination

**Google Integration (`gdrive.py`, AppScript files)**
- Downloads and processes Google Drive files
- Manages volunteer registration and tracking
- Handles transportation and accommodation coordination
- Provides real-time synchronization between sheets

### Data Structure
- CSV files in `data/` directory contain regional damage assessment data
- Excel files support multiple sheets representing different neighborhoods (鄰)
- Google Sheets integration manages volunteer information and team assignments

## Location-Specific Processing

The system handles different administrative regions with specific data formats:
- **東勢里**: Requires address cleaning to remove neighborhood prefixes
- **玉田里**: Different data structure and column mappings
- Each location has specific validation rules and data transformation requirements

## Key Features

- Multi-location support with region-specific data processing
- Automated phone number formatting and validation
- Coordinate system transformations (TWD97 ↔ WGS84)
- Real-time bidirectional synchronization with Google Sheets
- Volunteer ID generation based on name+phone combinations
- Geographic visualization with interactive maps
- Team assignment based on neighborhood proximity rules
- Use `black` or `yapf` for python formatting


## Git Commit Rules
- Follow Conventional branch naming and commit rules
