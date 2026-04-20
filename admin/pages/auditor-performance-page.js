/**
 * Auditor Performance Page Module
 * Shows comprehensive auditor performance metrics and statistics
 */

class AuditorPerformancePage {
    /**
     * Render the auditor performance page
     */
    static render(req, res) {
        const user = req.currentUser;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditor Performance - Food Safety Audit System</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #1e293b;
        }

        /* Header */
        .header {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
            max-width: 1800px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-section h1 {
            font-size: 1.5rem;
            color: #1e293b;
        }

        .logo-section .subtitle {
            font-size: 0.85rem;
            color: #64748b;
        }

        .user-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .user-name {
            font-weight: 500;
            color: #1e293b;
        }

        .badge-admin {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .btn-secondary {
            background: #f1f5f9;
            color: #475569;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
        }

        .btn-secondary:hover {
            background: #e2e8f0;
        }

        .btn-logout {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
        }

        .btn-logout:hover {
            background: #fecaca;
        }

        /* Main Container */
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Filter Section */
        .filter-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: visible;
        }

        .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-end;
            overflow: visible;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            position: relative;
        }

        .filter-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #64748b;
        }

        .filter-group select {
            padding: 0.5rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.875rem;
            min-width: 150px;
        }

        .btn-apply {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
        }

        .btn-apply:hover {
            background: #2563eb;
        }

        .btn-clear {
            background: #f1f5f9;
            color: #64748b;
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
        }

        .btn-clear:hover {
            background: #e2e8f0;
        }

        /* Multi-select Dropdown Component */
        .multi-select-dropdown {
            position: relative;
            min-width: 140px;
        }

        .multi-select-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #1e293b;
            padding: 0.35rem 0.6rem;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            min-width: 120px;
            white-space: nowrap;
        }

        .multi-select-header:hover {
            border-color: #3b82f6;
        }

        .multi-select-header .selected-text {
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
        }

        .multi-select-header .dropdown-arrow {
            font-size: 0.7rem;
            color: #64748b;
            transition: transform 0.2s;
        }

        .multi-select-dropdown.open .dropdown-arrow {
            transform: rotate(180deg);
        }

        .multi-select-options {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            min-width: 200px;
            max-height: 250px;
            overflow-y: auto;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            display: none;
            margin-top: 4px;
        }

        .multi-select-dropdown.open .multi-select-options {
            display: block;
        }

        .checkbox-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-size: 0.8rem;
            transition: background 0.15s;
        }

        .checkbox-option:hover {
            background: #f1f5f9;
        }

        .checkbox-option input[type="checkbox"] {
            width: 14px;
            height: 14px;
            cursor: pointer;
        }

        /* Cards Grid */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        /* Chart Card */
        .chart-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-card.full-width {
            grid-column: 1 / -1;
        }

        .chart-card h2 {
            font-size: 1.25rem;
            color: #1e293b;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .chart-card h3 {
            font-size: 1rem;
            color: #475569;
            margin: 1.5rem 0 1rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 1rem;
        }

        .chart-container {
            height: 350px;
            position: relative;
        }

        .chart-container.small {
            height: 250px;
        }

        /* Data Table */
        .data-table-container {
            margin-top: 1rem;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }

        .data-table th,
        .data-table td {
            padding: 0.6rem 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        .data-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #64748b;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .data-table tbody tr:hover {
            background: #f8fafc;
        }

        .data-table td.pass,
        .data-table .pass {
            color: #10b981;
            font-weight: 600;
        }

        .data-table td.fail,
        .data-table .fail {
            color: #ef4444;
            font-weight: 600;
        }

        .data-table td.warn,
        .data-table .warn {
            color: #f59e0b;
            font-weight: 600;
        }

        .badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-pass {
            background: #dcfce7;
            color: #16a34a;
        }

        .badge-fail {
            background: #fee2e2;
            color: #dc2626;
        }

        .badge-warn {
            background: #fef3c7;
            color: #d97706;
        }

        .badge-info {
            background: #dbeafe;
            color: #2563eb;
        }

        /* Summary Cards */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .summary-card {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .summary-card .value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e293b;
        }

        .summary-card .label {
            font-size: 0.8rem;
            color: #64748b;
            margin-top: 0.5rem;
        }

        .summary-card.highlight {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .summary-card.highlight .value,
        .summary-card.highlight .label {
            color: white;
        }

        .summary-card.green {
            background: linear-gradient(135deg, #10b981, #059669);
        }

        .summary-card.green .value,
        .summary-card.green .label {
            color: white;
        }

        .summary-card.orange {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .summary-card.orange .value,
        .summary-card.orange .label {
            color: white;
        }

        .summary-card.red {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .summary-card.red .value,
        .summary-card.red .label {
            color: white;
        }

        /* Detail Stats Cards */
        .detail-stats-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .detail-stat-card {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .detail-stat-card .card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: #475569;
        }

        .detail-stat-card .card-header .icon {
            font-size: 1rem;
        }

        .detail-stat-card select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.85rem;
            margin-bottom: 0.75rem;
            background: #f8fafc;
        }

        .detail-stat-card .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            text-align: center;
        }

        .detail-stat-card .stat-label {
            font-size: 0.75rem;
            color: #64748b;
            text-align: center;
            margin-top: 0.25rem;
        }

        /* Tabs */
        .tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0;
        }

        .tab {
            padding: 0.75rem 1.5rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 500;
            color: #64748b;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
        }

        .tab:hover {
            color: #3b82f6;
        }

        .tab.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Input styles */
        input[type="number"] {
            width: 80px;
            padding: 0.4rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.875rem;
        }

        .btn-save {
            background: #10b981;
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .btn-save:hover {
            background: #059669;
        }

        /* No Data Message */
        .no-data {
            text-align: center;
            padding: 2rem;
            color: #64748b;
        }

        /* Tooltip */
        .tooltip {
            position: relative;
            cursor: help;
        }

        .tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 100;
        }

        /* Variance indicators */
        .variance-fast { color: #10b981; }
        .variance-slow { color: #ef4444; }
        .variance-normal { color: #64748b; }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <h1>👥 Auditor Performance</h1>
                <p class="subtitle">Track and analyze auditor metrics</p>
            </div>
            <div class="user-section">
                <span class="user-name">${user.displayName || user.email}</span>
                <span class="badge-admin">${user.role}</span>
                <a href="/admin/analytics" class="btn-secondary">📊 Stores Analytics</a>
                <a href="/dashboard" class="btn-secondary">Back to Dashboard</a>
                <a href="/auth/logout" class="btn-logout">Logout</a>
            </div>
        </div>
    </header>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading auditor data...</p>
    </div>

    <!-- Main Content -->
    <main class="container">
        <!-- Filters -->
        <section class="filter-section">
            <div class="filter-row">
                <div class="filter-group">
                    <label>Country:</label>
                    <div class="multi-select-dropdown" id="countryDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('countryDropdown', event)">
                            <span class="selected-text">All Countries</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="countryOptions">
                            <label class="checkbox-option">
                                <input type="checkbox" value="Lebanon" onchange="updateDropdownText('countryDropdown')"> Lebanon
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="Iraq" onchange="updateDropdownText('countryDropdown')"> Iraq
                            </label>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Brand:</label>
                    <div class="multi-select-dropdown" id="brandDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('brandDropdown', event)">
                            <span class="selected-text">All Brands</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="brandOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Scheme:</label>
                    <div class="multi-select-dropdown" id="schemeDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('schemeDropdown', event)">
                            <span class="selected-text">All Schemes</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="schemeOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Store:</label>
                    <div class="multi-select-dropdown" id="storeDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('storeDropdown', event)">
                            <span class="selected-text">All Stores</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="storeOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Auditor:</label>
                    <div class="multi-select-dropdown" id="auditorDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('auditorDropdown', event)">
                            <span class="selected-text">All Auditors</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="auditorOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Year:</label>
                    <div class="multi-select-dropdown" id="yearDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('yearDropdown', event)">
                            <span class="selected-text">All Years</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="yearOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Cycle:</label>
                    <div class="multi-select-dropdown" id="cycleDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('cycleDropdown', event)">
                            <span class="selected-text">All Cycles</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="cycleOptions">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <button class="btn-apply" onclick="loadAllData()">🔄 Apply</button>
                <button class="btn-clear" onclick="clearFilters()">✖ Clear</button>
            </div>
        </section>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card highlight">
                <div class="value" id="totalAuditors">-</div>
                <div class="label">Total Auditors</div>
            </div>
            <div class="summary-card">
                <div class="value" id="totalAudits">-</div>
                <div class="label">Total Audits</div>
            </div>
            <div class="summary-card green">
                <div class="value" id="passedAudits">-</div>
                <div class="label">Passed Audits</div>
            </div>
            <div class="summary-card red">
                <div class="value" id="failedAudits">-</div>
                <div class="label">Failed Audits</div>
            </div>
            <div class="summary-card green">
                <div class="value" id="passingRate">-</div>
                <div class="label">Passing Rate (%)</div>
            </div>
            <div class="summary-card red">
                <div class="value" id="failingRate">-</div>
                <div class="label">Failing Rate (%)</div>
            </div>
            <div class="summary-card orange">
                <div class="value" id="avgDuration">-</div>
                <div class="label">Avg Audit Duration</div>
            </div>
            <div class="summary-card">
                <div class="value" id="avgSendTime">-</div>
                <div class="label">Avg Send Time (days)</div>
            </div>
        </div>

        <!-- Detail Stats Cards with Dropdowns -->
        <div class="detail-stats-cards">
            <div class="detail-stat-card">
                <div class="card-header"><span class="icon">⏱️</span> Avg Duration by Scheme</div>
                <select id="durationSchemeSelect" onchange="updateDurationByScheme()"></select>
                <div class="stat-value" id="durationBySchemeValue">-</div>
                <div class="stat-label">minutes per audit</div>
            </div>
            <div class="detail-stat-card">
                <div class="card-header"><span class="icon">🏪</span> Avg Duration by Branch</div>
                <select id="durationBranchSelect" onchange="updateDurationByBranch()"></select>
                <div class="stat-value" id="durationByBranchValue">-</div>
                <div class="stat-label">minutes per audit</div>
            </div>
            <div class="detail-stat-card">
                <div class="card-header"><span class="icon">👤</span> Avg Duration by Auditor</div>
                <select id="durationAuditorSelect" onchange="updateDurationByAuditor()"></select>
                <div class="stat-value" id="durationByAuditorValue">-</div>
                <div class="stat-label">minutes per audit</div>
            </div>
            <div class="detail-stat-card">
                <div class="card-header"><span class="icon">📧</span> Avg Send Time by Auditor</div>
                <select id="sendTimeAuditorSelect" onchange="updateSendTimeByAuditor()"></select>
                <div class="stat-value" id="sendTimeByAuditorValue">-</div>
                <div class="stat-label">days to send report</div>
            </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('overview')">📊 Auditor Performance Overview</button>
            <button class="tab" onclick="switchTab('duration')">⏱️ Audit Duration</button>
            <button class="tab" onclick="switchTab('sendTime')">📧 Report Submission Time</button>
            <button class="tab" onclick="switchTab('findings')">🔍 Findings Analysis</button>
            <button class="tab" onclick="switchTab('settings')">⚙️ Settings</button>
        </div>

        <!-- Tab: Overview -->
        <div id="tab-overview" class="tab-content active">
            <div class="cards-grid">
                <!-- Audits by Auditor -->
                <section class="chart-card">
                    <h2>📈 Audits by Auditor</h2>
                    <div class="chart-container small">
                        <canvas id="auditsCountChart"></canvas>
                    </div>
                </section>

                <!-- Score Distribution by Branch/Auditor/Year -->
                <section class="chart-card full-width">
                    <h2>🎯 Score Distribution by Branch / Auditor / Year</h2>
                    <p id="scoreDistributionDesc" style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Average scores per branch and auditor. The dashed line shows the passing threshold.
                        <span class="pass">Green</span> = Pass, <span class="fail">Red</span> = Fail
                    </p>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="scoreDistributionChart"></canvas>
                    </div>
                    <div id="scoreDistributionTable" class="data-table-container" style="margin-top: 1rem;"></div>
                </section>

                <!-- Auditor Performance Overview Table -->
                <section class="chart-card full-width">
                    <h2>📋 Auditor Performance Overview</h2>
                    <div id="auditorOverviewTable" class="data-table-container"></div>
                </section>

                <!-- Pass/Fail by Auditor -->
                <section class="chart-card full-width">
                    <h2>✅ Pass/Fail by Auditor</h2>
                    <div id="passFailAuditorTable" class="data-table-container"></div>
                </section>

                <!-- Pass/Fail by Branch -->
                <section class="chart-card full-width">
                    <h2>🏪 Pass/Fail by Branch</h2>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap;">
                        <label style="font-size: 0.875rem; color: #64748b;">Sort by:</label>
                        <select id="branchSortField" onchange="renderPassFailByBranchTable()" style="padding: 0.4rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;">
                            <option value="storeName">Store Name</option>
                            <option value="total">Total Audits</option>
                            <option value="passRate">Passing Rate</option>
                            <option value="failRate">Failing Rate</option>
                            <option value="avgScore">Average Score</option>
                        </select>
                        <select id="branchSortOrder" onchange="renderPassFailByBranchTable()" style="padding: 0.4rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;">
                            <option value="asc">Ascending ↑</option>
                            <option value="desc">Descending ↓</option>
                        </select>
                    </div>
                    <div id="passFailBranchTable" class="data-table-container"></div>
                </section>
            </div>
        </div>

        <!-- Tab: Audit Duration -->
        <div id="tab-duration" class="tab-content">
            <div class="cards-grid">
                <!-- Duration Analysis Chart -->
                <section class="chart-card full-width">
                    <h2>⏱️ Audit Duration Analysis (Time In/Out)</h2>
                    <div class="chart-container">
                        <canvas id="durationChart"></canvas>
                    </div>
                </section>

                <!-- Duration Variance Table -->
                <section class="chart-card full-width">
                    <h2>📋 Duration vs Standard Time</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Shows average audit duration per store compared to the standard expected duration.
                        <span class="variance-fast">Green</span> = faster than expected, 
                        <span class="variance-slow">Red</span> = slower than expected.
                    </p>
                    <div id="durationVarianceTable" class="data-table-container"></div>
                </section>

                <!-- Deviation Summary Table -->
                <section class="chart-card full-width">
                    <h2>⚠️ Deviation Summary (Branches & Auditors with Variance)</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Summary of audits with significant deviations from standard time (±10 minutes).
                        <span class="variance-fast">Green</span> = faster, <span class="variance-slow">Red</span> = slower.
                    </p>
                    <div id="deviationSummaryTable" class="data-table-container"></div>
                </section>
            </div>
        </div>

        <!-- Tab: Report Send Time -->
        <div id="tab-sendTime" class="tab-content">
            <div class="cards-grid">
                <!-- Send Time Chart -->
                <section class="chart-card full-width">
                    <h2>📧 Time to Send Reports (Audit Date → Email Sent)</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Average days to send reports per auditor. The dashed line shows the 5-day target.
                        <span class="pass">Green</span> = ≤5 days, <span class="warn">Orange</span> = 5-7 days, <span class="fail">Red</span> = >7 days.
                    </p>
                    <div class="chart-container">
                        <canvas id="sendTimeChart"></canvas>
                    </div>
                </section>

                <!-- Send Time Table -->
                <section class="chart-card full-width">
                    <h2>📋 Report Submission Details</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Target: 5 days. Variance shows the difference from the target.
                    </p>
                    <div id="sendTimeTable" class="data-table-container"></div>
                </section>

                <!-- Send Time Deviations Table -->
                <section class="chart-card full-width">
                    <h2>⚠️ Send Time Deviations (Exceeded 5-Day Target)</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        List of reports that exceeded the 5-day target, sorted by variance (biggest delays first).
                    </p>
                    <div id="sendTimeDeviationsTable" class="data-table-container"></div>
                </section>
            </div>
        </div>

        <!-- Tab: Findings Analysis -->
        <div id="tab-findings" class="tab-content">
            <div class="cards-grid">
                <!-- Findings by Auditor Chart -->
                <section class="chart-card full-width">
                    <h2>🔍 Avg Findings per Auditor</h2>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="findingsAuditorChart"></canvas>
                    </div>
                </section>

                <!-- Detailed Findings Table -->
                <section class="chart-card full-width">
                    <h2>📋 Findings per Store per Auditor</h2>
                    <div id="findingsTable" class="data-table-container"></div>
                </section>
            </div>
        </div>

        <!-- Tab: Settings -->
        <div id="tab-settings" class="tab-content">
            <div class="cards-grid">
                <section class="chart-card full-width">
                    <h2>⚙️ Standard Audit Duration Settings</h2>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.875rem;">
                        Set the expected audit duration (in minutes) for each store. This is used to calculate variance in the Duration tab.
                    </p>
                    <div id="settingsTable" class="data-table-container"></div>
                </section>
            </div>
        </div>
    </main>

    <script>
        // Chart instances
        let auditorChart = null;
        let auditsCountChart = null;
        let scoreDistributionChart = null;
        let durationChart = null;
        let sendTimeChart = null;
        let findingsAuditorChart = null;

        // Register datalabels plugin
        Chart.register(ChartDataLabels);

        // Data cache
        let perfData = null;
        let analyticsData = null;
        let passingThreshold = 87;

        // Initialize page
        document.addEventListener('DOMContentLoaded', async () => {
            await initFilters();
            await loadAllData();
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.multi-select-dropdown')) {
                    document.querySelectorAll('.multi-select-dropdown.open').forEach(d => d.classList.remove('open'));
                }
            });
        });

        // Toggle multi-select dropdown
        function toggleDropdown(dropdownId, event) {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById(dropdownId);
            const wasOpen = dropdown.classList.contains('open');
            
            // Close all dropdowns
            document.querySelectorAll('.multi-select-dropdown.open').forEach(d => d.classList.remove('open'));
            
            // Toggle this one
            if (!wasOpen) dropdown.classList.add('open');
        }

        // Update dropdown header text based on checked options
        function updateDropdownText(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
            const textSpan = dropdown.querySelector('.selected-text');
            
            if (checkboxes.length === 0) {
                const defaultTexts = {
                    'countryDropdown': 'All Countries',
                    'brandDropdown': 'All Brands',
                    'schemeDropdown': 'All Schemes',
                    'storeDropdown': 'All Stores',
                    'auditorDropdown': 'All Auditors',
                    'yearDropdown': 'All Years',
                    'cycleDropdown': 'All Cycles'
                };
                textSpan.textContent = defaultTexts[dropdownId] || 'All';
            } else if (checkboxes.length === 1) {
                textSpan.textContent = checkboxes[0].parentElement.textContent.trim();
            } else {
                textSpan.textContent = checkboxes.length + ' selected';
            }
        }

        // Get selected values from a multi-select dropdown
        function getMultiSelectValues(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        // Tab switching
        function switchTab(tabId) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab
            document.querySelector(\`.tab[onclick="switchTab('\${tabId}')"]\`).classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        }

        // Initialize filter dropdowns
        async function initFilters() {
            try {
                // Load years
                const currentYear = new Date().getFullYear();
                const yearOptions = document.getElementById('yearOptions');
                for (let y = currentYear; y >= currentYear - 5; y--) {
                    const label = document.createElement('label');
                    label.className = 'checkbox-option';
                    label.innerHTML = \`<input type="checkbox" value="\${y}" onchange="updateDropdownText('yearDropdown')"> \${y}\`;
                    yearOptions.appendChild(label);
                }

                // Load cycles
                const cyclesResponse = await fetch('/api/admin/cycles');
                if (cyclesResponse.ok) {
                    const cyclesData = await cyclesResponse.json();
                    const cycleOptions = document.getElementById('cycleOptions');
                    (Array.isArray(cyclesData) ? cyclesData : []).forEach(c => {
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`<input type="checkbox" value="\${c}" onchange="updateDropdownText('cycleDropdown')"> \${c}\`;
                        cycleOptions.appendChild(label);
                    });
                }

                // Load brands
                const brandsResponse = await fetch('/api/admin/brands');
                if (brandsResponse.ok) {
                    const brandsData = await brandsResponse.json();
                    const brandOptions = document.getElementById('brandOptions');
                    (Array.isArray(brandsData) ? brandsData : []).forEach(b => {
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`<input type="checkbox" value="\${b}" onchange="updateDropdownText('brandDropdown')"> \${b}\`;
                        brandOptions.appendChild(label);
                    });
                }

                // Load schemes
                const schemesResponse = await fetch('/api/admin/schemes');
                if (schemesResponse.ok) {
                    const schemesData = await schemesResponse.json();
                    const schemeOptions = document.getElementById('schemeOptions');
                    (Array.isArray(schemesData) ? schemesData : []).forEach(s => {
                        const name = s.schemaName || s.SchemaName;
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`<input type="checkbox" value="\${name}" onchange="updateDropdownText('schemeDropdown')"> \${name}\`;
                        schemeOptions.appendChild(label);
                    });
                }

                // Load stores
                const storesResponse = await fetch('/api/admin/stores');
                if (storesResponse.ok) {
                    const storesData = await storesResponse.json();
                    const storeOptions = document.getElementById('storeOptions');
                    // Handle both {stores: [...]} and direct array format
                    const storesArray = storesData.stores || (Array.isArray(storesData) ? storesData : []);
                    console.log('📊 First store object:', storesArray[0]);
                    storesArray.forEach(s => {
                        const storeId = s.storeId || s.StoreID || s.store_id || s.id;
                        const storeName = s.storeName || s.StoreName || s.store_name || s.name;
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`<input type="checkbox" value="\${storeId}" onchange="updateDropdownText('storeDropdown')"> \${storeName}\`;
                        storeOptions.appendChild(label);
                    });
                }

                // Load auditors
                const auditorsResponse = await fetch('/api/admin/auditors');
                if (auditorsResponse.ok) {
                    const auditorsData = await auditorsResponse.json();
                    const auditorOptions = document.getElementById('auditorOptions');
                    (Array.isArray(auditorsData) ? auditorsData : []).forEach(a => {
                        // a is a string (auditor name from AuditInstances)
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`<input type="checkbox" value="\${a}" onchange="updateDropdownText('auditorDropdown')"> \${a}\`;
                        auditorOptions.appendChild(label);
                    });
                }
            } catch (error) {
                console.error('Error initializing filters:', error);
            }
        }

        // Clear filters
        function clearFilters() {
            // Uncheck all checkboxes in all dropdowns
            document.querySelectorAll('.multi-select-options input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Reset all dropdown texts
            ['countryDropdown', 'brandDropdown', 'schemeDropdown', 'storeDropdown', 'auditorDropdown', 'yearDropdown', 'cycleDropdown'].forEach(id => {
                updateDropdownText(id);
            });
            
            loadAllData();
        }

        // Show/hide loading
        function showLoading(show) {
            document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
        }

        // Build query params from multi-select dropdowns
        function getFilterParams() {
            const params = new URLSearchParams();
            
            const countries = getMultiSelectValues('countryDropdown');
            const brands = getMultiSelectValues('brandDropdown');
            const storeIds = getMultiSelectValues('storeDropdown');
            const auditors = getMultiSelectValues('auditorDropdown');
            const years = getMultiSelectValues('yearDropdown');
            const cycles = getMultiSelectValues('cycleDropdown');
            
            if (countries.length > 0) params.append('countries', countries.join(','));
            if (brands.length > 0) params.append('brands', brands.join(','));
            if (storeIds.length > 0) params.append('storeIds', storeIds.join(','));
            if (auditors.length > 0) params.append('auditors', auditors.join(','));
            if (years.length > 0) params.append('years', years.join(','));
            if (cycles.length > 0) params.append('cycles', cycles.join(','));
            
            return params;
        }

        // Load all data
        async function loadAllData() {
            showLoading(true);
            try {
                const params = getFilterParams();
                
                // Load both endpoints in parallel
                const [perfResponse, analyticsResponse] = await Promise.all([
                    fetch('/api/admin/auditor-performance?' + params.toString()),
                    fetch('/api/admin/analytics?' + params.toString())
                ]);

                if (!perfResponse.ok) throw new Error('Failed to load performance data');
                if (!analyticsResponse.ok) throw new Error('Failed to load analytics data');

                perfData = await perfResponse.json();
                analyticsData = await analyticsResponse.json();
                
                // Get default passing threshold (first schema's threshold or 87)
                const thresholds = perfData.schemaThresholds || {};
                const firstSchemaKey = Object.keys(thresholds)[0];
                passingThreshold = firstSchemaKey ? thresholds[firstSchemaKey].passingGrade : 87;

                // Render all components
                renderSummaryCards();
                renderOverviewTab();
                renderDurationTab();
                renderSendTimeTab();
                renderFindingsTab();
                renderSettingsTab();
                
            } catch (error) {
                console.error('Error loading data:', error);
                alert('Error loading data: ' + error.message);
            } finally {
                showLoading(false);
            }
        }

        // Format minutes to hours:minutes
        function formatDuration(minutes) {
            if (minutes == null) return '-';
            const hrs = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            if (hrs > 0) return hrs + 'h ' + mins + 'm';
            return mins + 'm';
        }

        // Format hours
        function formatHours(hours) {
            if (hours == null) return '-';
            if (hours < 24) return Math.round(hours) + 'h';
            const days = Math.floor(hours / 24);
            const remainingHours = Math.round(hours % 24);
            return days + 'd ' + remainingHours + 'h';
        }

        // Render summary cards
        function renderSummaryCards() {
            const passFailData = perfData.passFailByAuditor || [];
            const durationData = perfData.auditDurations || [];
            const sendTimeData = perfData.submissionTimes || [];

            // Use actual auditor count from Users table (role = 'Auditor')
            const totalAuditors = perfData.actualAuditorCount || passFailData.length;
            const totalAudits = passFailData.reduce((sum, a) => sum + a.TotalAudits, 0);
            const passedAudits = passFailData.reduce((sum, a) => sum + a.PassedAudits, 0);
            const failedAudits = passFailData.reduce((sum, a) => sum + a.FailedAudits, 0);

            // Calculate avg duration
            const durationsWithTime = durationData.filter(d => d.DurationMinutes != null);
            const avgDuration = durationsWithTime.length > 0
                ? durationsWithTime.reduce((sum, d) => sum + d.DurationMinutes, 0) / durationsWithTime.length
                : null;

            // Calculate avg send time (convert hours to days)
            const sendTimesWithData = sendTimeData.filter(s => s.HoursToSend != null);
            const avgSendTimeHours = sendTimesWithData.length > 0
                ? sendTimesWithData.reduce((sum, s) => sum + s.HoursToSend, 0) / sendTimesWithData.length
                : null;
            const avgSendTimeDays = avgSendTimeHours != null ? avgSendTimeHours / 24 : null;

            // Calculate passing/failing rates
            const passingRate = totalAudits > 0 ? ((passedAudits / totalAudits) * 100).toFixed(1) : 0;
            const failingRate = totalAudits > 0 ? ((failedAudits / totalAudits) * 100).toFixed(1) : 0;

            document.getElementById('totalAuditors').textContent = totalAuditors;
            document.getElementById('totalAudits').textContent = totalAudits;
            document.getElementById('passedAudits').textContent = passedAudits;
            document.getElementById('failedAudits').textContent = failedAudits;
            document.getElementById('passingRate').textContent = passingRate + '%';
            document.getElementById('failingRate').textContent = failingRate + '%';
            document.getElementById('avgDuration').textContent = formatDuration(avgDuration);
            document.getElementById('avgSendTime').textContent = avgSendTimeDays != null ? avgSendTimeDays.toFixed(1) : '-';
            
            // Populate detail stats dropdowns
            populateDetailStatsDropdowns();
        }

        // ============================================
        // DETAIL STATS CARDS (Per-Scheme, Per-Branch, Per-Auditor)
        // ============================================
        function populateDetailStatsDropdowns() {
            const durationData = perfData.auditDurations || [];
            const sendTimeData = perfData.submissionTimes || [];
            
            // Get unique schemes from duration data
            const schemes = [...new Set(durationData.map(d => d.SchemaName).filter(Boolean))].sort();
            const schemeSelect = document.getElementById('durationSchemeSelect');
            schemeSelect.innerHTML = '<option value="">Select Scheme</option>' + 
                schemes.map(s => '<option value="' + s + '">' + s + '</option>').join('');
            
            // Get unique branches from duration data
            const branches = [...new Set(durationData.map(d => d.StoreName).filter(Boolean))].sort();
            const branchSelect = document.getElementById('durationBranchSelect');
            branchSelect.innerHTML = '<option value="">Select Branch</option>' + 
                branches.map(b => '<option value="' + b + '">' + b + '</option>').join('');
            
            // Get unique auditors from duration data
            const durationAuditors = [...new Set(durationData.map(d => d.Auditors).filter(Boolean))].sort();
            const durationAuditorSelect = document.getElementById('durationAuditorSelect');
            durationAuditorSelect.innerHTML = '<option value="">Select Auditor</option>' + 
                durationAuditors.map(a => '<option value="' + a + '">' + a + '</option>').join('');
            
            // Get unique auditors from send time data
            const sendTimeAuditors = [...new Set(sendTimeData.map(d => d.Auditors).filter(Boolean))].sort();
            const sendTimeAuditorSelect = document.getElementById('sendTimeAuditorSelect');
            sendTimeAuditorSelect.innerHTML = '<option value="">Select Auditor</option>' + 
                sendTimeAuditors.map(a => '<option value="' + a + '">' + a + '</option>').join('');
            
            // Reset values
            document.getElementById('durationBySchemeValue').textContent = '-';
            document.getElementById('durationByBranchValue').textContent = '-';
            document.getElementById('durationByAuditorValue').textContent = '-';
            document.getElementById('sendTimeByAuditorValue').textContent = '-';
        }
        
        function updateDurationByScheme() {
            const scheme = document.getElementById('durationSchemeSelect').value;
            if (!scheme) {
                document.getElementById('durationBySchemeValue').textContent = '-';
                return;
            }
            const durationData = perfData.auditDurations || [];
            const filtered = durationData.filter(d => d.SchemaName === scheme && d.DurationMinutes != null);
            if (filtered.length === 0) {
                document.getElementById('durationBySchemeValue').textContent = '-';
                return;
            }
            const avg = filtered.reduce((sum, d) => sum + d.DurationMinutes, 0) / filtered.length;
            document.getElementById('durationBySchemeValue').textContent = Math.round(avg);
        }
        
        function updateDurationByBranch() {
            const branch = document.getElementById('durationBranchSelect').value;
            if (!branch) {
                document.getElementById('durationByBranchValue').textContent = '-';
                return;
            }
            const durationData = perfData.auditDurations || [];
            const filtered = durationData.filter(d => d.StoreName === branch && d.DurationMinutes != null);
            if (filtered.length === 0) {
                document.getElementById('durationByBranchValue').textContent = '-';
                return;
            }
            const avg = filtered.reduce((sum, d) => sum + d.DurationMinutes, 0) / filtered.length;
            document.getElementById('durationByBranchValue').textContent = Math.round(avg);
        }
        
        function updateDurationByAuditor() {
            const auditor = document.getElementById('durationAuditorSelect').value;
            if (!auditor) {
                document.getElementById('durationByAuditorValue').textContent = '-';
                return;
            }
            const durationData = perfData.auditDurations || [];
            const filtered = durationData.filter(d => d.Auditors === auditor && d.DurationMinutes != null);
            if (filtered.length === 0) {
                document.getElementById('durationByAuditorValue').textContent = '-';
                return;
            }
            const avg = filtered.reduce((sum, d) => sum + d.DurationMinutes, 0) / filtered.length;
            document.getElementById('durationByAuditorValue').textContent = Math.round(avg);
        }
        
        function updateSendTimeByAuditor() {
            const auditor = document.getElementById('sendTimeAuditorSelect').value;
            if (!auditor) {
                document.getElementById('sendTimeByAuditorValue').textContent = '-';
                return;
            }
            const sendTimeData = perfData.submissionTimes || [];
            const filtered = sendTimeData.filter(d => d.Auditors === auditor && d.HoursToSend != null);
            if (filtered.length === 0) {
                document.getElementById('sendTimeByAuditorValue').textContent = '-';
                return;
            }
            const avgHours = filtered.reduce((sum, d) => sum + d.HoursToSend, 0) / filtered.length;
            const avgDays = avgHours / 24;
            document.getElementById('sendTimeByAuditorValue').textContent = avgDays.toFixed(1);
        }

        // ============================================
        // OVERVIEW TAB
        // ============================================
        function renderOverviewTab() {
            const auditors = analyticsData.auditorPerformance || [];
            renderAuditsCountChart(auditors);
            renderScoreDistributionChart();
            renderAuditorOverviewTable();
            renderPassFailByAuditorTable();
            renderPassFailByBranchTable();
        }

        function renderAuditorOverviewTable() {
            // Combine data from analyticsData.auditorPerformance (has min/max) and perfData.passFailByAuditor (has pass/fail)
            const auditorStats = analyticsData.auditorPerformance || [];
            const passFailData = perfData.passFailByAuditor || [];
            
            if (auditorStats.length === 0) {
                document.getElementById('auditorOverviewTable').innerHTML = '<p class="no-data">No auditor data available</p>';
                return;
            }

            // Create a map of pass/fail data by auditor name for quick lookup
            const passFailMap = {};
            passFailData.forEach(pf => {
                const name = (pf.Auditors || 'Unknown').trim().toLowerCase();
                passFailMap[name] = pf;
            });

            // Merge the data
            const merged = auditorStats.map(a => {
                const name = (a.auditorName || 'Unknown').trim().toLowerCase();
                const pf = passFailMap[name] || {};
                const totalAudits = pf.TotalAudits || a.auditCount || 0;
                const passedAudits = pf.PassedAudits || 0;
                const failedAudits = pf.FailedAudits || 0;
                const passingRate = totalAudits > 0 ? ((passedAudits / totalAudits) * 100) : 0;
                const failingRate = totalAudits > 0 ? ((failedAudits / totalAudits) * 100) : 0;
                
                return {
                    auditorName: a.auditorName || 'Unknown',
                    auditCount: totalAudits,
                    avgScore: a.avgScore || 0,
                    minScore: a.minScore || 0,
                    maxScore: a.maxScore || 0,
                    passedAudits,
                    failedAudits,
                    passingRate,
                    failingRate
                };
            });

            // Sort by number of audits descending
            merged.sort((a, b) => b.auditCount - a.auditCount);

            document.getElementById('auditorOverviewTable').innerHTML = \`
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Auditor</th>
                            <th>No. of Audits</th>
                            <th>Avg Score</th>
                            <th>Min Score</th>
                            <th>Max Score</th>
                            <th>Passed</th>
                            <th>Pass Rate</th>
                            <th>Failed</th>
                            <th>Fail Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${merged.map((a, idx) => {
                            const avgClass = a.avgScore >= passingThreshold ? 'pass' : 'fail';
                            const minClass = a.minScore >= passingThreshold ? 'pass' : 'fail';
                            const maxClass = a.maxScore >= passingThreshold ? 'pass' : 'fail';
                            const passRateClass = a.passingRate >= 80 ? 'pass' : a.passingRate >= 60 ? 'warn' : 'fail';
                            const failRateClass = a.failingRate <= 20 ? 'pass' : a.failingRate <= 40 ? 'warn' : 'fail';
                            return \`
                                <tr>
                                    <td>\${idx + 1}</td>
                                    <td>\${a.auditorName}</td>
                                    <td>\${a.auditCount}</td>
                                    <td class="\${avgClass}">\${a.avgScore.toFixed(1)}%</td>
                                    <td class="\${minClass}">\${a.minScore.toFixed(1)}%</td>
                                    <td class="\${maxClass}">\${a.maxScore.toFixed(1)}%</td>
                                    <td class="pass">\${a.passedAudits}</td>
                                    <td class="\${passRateClass}">\${a.passingRate.toFixed(1)}%</td>
                                    <td class="fail">\${a.failedAudits}</td>
                                    <td class="\${failRateClass}">\${a.failingRate.toFixed(1)}%</td>
                                </tr>
                            \`;
                        }).join('')}
                    </tbody>
                </table>
            \`;
        }

        function renderAuditorChart(auditors) {
            const ctx = document.getElementById('auditorChart').getContext('2d');
            if (auditorChart) auditorChart.destroy();

            const labels = auditors.map(a => a.auditorName);
            const scores = auditors.map(a => a.avgScore);
            const colors = scores.map(s => s >= passingThreshold ? '#10b981' : '#ef4444');

            auditorChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: scores,
                        backgroundColor: colors,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { min: 0, max: 100, title: { display: true, text: 'Average Score (%)' } }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: { display: false },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    xMin: passingThreshold,
                                    xMax: passingThreshold,
                                    borderColor: '#64748b',
                                    borderWidth: 2,
                                    borderDash: [5, 5]
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderAuditsCountChart(auditors) {
            const ctx = document.getElementById('auditsCountChart').getContext('2d');
            if (auditsCountChart) auditsCountChart.destroy();

            const sorted = [...auditors].sort((a, b) => b.auditCount - a.auditCount);
            auditsCountChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: sorted.map(a => a.auditorName),
                    datasets: [{
                        data: sorted.map(a => a.auditCount),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#14b8a6']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }, datalabels: { display: false } } }
            });
        }

        function renderScoreDistributionChart() {
            const ctx = document.getElementById('scoreDistributionChart').getContext('2d');
            if (scoreDistributionChart) scoreDistributionChart.destroy();

            const data = perfData.scoreByBranchAuditorYear || [];
            
            if (data.length === 0) {
                document.getElementById('scoreDistributionChart').parentElement.innerHTML = '<p class="no-data">No score distribution data available</p>';
                document.getElementById('scoreDistributionTable').innerHTML = '';
                return;
            }

            // Update description - thresholds are now per schema
            const descEl = document.getElementById('scoreDistributionDesc');
            if (descEl) {
                descEl.innerHTML = \`Average scores per branch, auditor, and schema. The dashed line shows each schema's passing threshold. <span class="pass">Green</span> = Pass, <span class="fail">Red</span> = Fail\`;
            }

            // Create labels: "Branch - Auditor (Year) [Schema]"
            const labels = data.map(d => \`\${d.StoreName} - \${d.Auditors || 'Unknown'} (\${d.Year}) [\${d.SchemaName || 'N/A'}]\`);
            const scores = data.map(d => d.AvgScore || 0);
            // Use per-record PassingGrade for colors
            const colors = data.map(d => {
                const threshold = d.PassingGrade || 87;
                return (d.AvgScore || 0) >= threshold ? '#10b981' : '#ef4444';
            });

            // Create threshold line data using each record's PassingGrade
            const thresholdLine = data.map(d => d.PassingGrade || 87);

            scoreDistributionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Average Score (%)',
                            data: scores,
                            backgroundColor: colors,
                            borderRadius: 4,
                            order: 2
                        },
                        {
                            label: 'Passing Grade (per schema)',
                            data: thresholdLine,
                            type: 'line',
                            borderColor: '#64748b',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 3,
                            pointBackgroundColor: '#64748b',
                            fill: false,
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            min: 0, 
                            max: 105, 
                            title: { display: true, text: 'Score (%)' }
                        },
                        x: { 
                            title: { display: true, text: 'Branch - Auditor (Year) [Schema]' },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 10 }
                            }
                        }
                    },
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top'
                        },
                        datalabels: {
                            display: function(context) {
                                return context.datasetIndex === 0;
                            },
                            anchor: 'end',
                            align: 'top',
                            color: function(context) {
                                return context.dataset.backgroundColor[context.dataIndex];
                            },
                            font: { weight: 'bold', size: 11 },
                            formatter: function(value) {
                                return value ? value.toFixed(1) + '%' : '';
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        const d = data[context.dataIndex];
                                        const threshold = d.PassingGrade || 87;
                                        const status = d.AvgScore >= threshold ? '✅ PASS' : '❌ FAIL';
                                        return [
                                            \`Avg Score: \${d.AvgScore.toFixed(1)}% \${status}\`,
                                            \`Passing Grade: \${threshold}%\`,
                                            \`Schema: \${d.SchemaName || 'N/A'}\`,
                                            \`Min: \${d.MinScore?.toFixed(1) || 0}% | Max: \${d.MaxScore?.toFixed(1) || 0}%\`,
                                            \`Audits: \${d.AuditCount} (Pass: \${d.PassedAudits}, Fail: \${d.FailedAudits})\`
                                        ];
                                    }
                                    const d = data[context.dataIndex];
                                    return \`Passing Grade: \${d.PassingGrade || 87}%\`;
                                }
                            }
                        }
                    }
                }
            });

            // Render the table below the chart
            renderScoreDistributionTable(data);
        }

        function renderScoreDistributionTable(data) {
            if (!data || data.length === 0) {
                document.getElementById('scoreDistributionTable').innerHTML = '<p class="no-data">No data</p>';
                return;
            }

            // Sort by Year DESC, then StoreName, then Auditor
            const sorted = [...data].sort((a, b) => {
                if (b.Year !== a.Year) return b.Year - a.Year;
                if (a.StoreName !== b.StoreName) return a.StoreName.localeCompare(b.StoreName);
                return (a.Auditors || '').localeCompare(b.Auditors || '');
            });

            document.getElementById('scoreDistributionTable').innerHTML = \`
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Year</th>
                            <th>Branch</th>
                            <th>Auditor</th>
                            <th>Schema</th>
                            <th>Pass Grade</th>
                            <th>Audits</th>
                            <th>Avg Score</th>
                            <th>Min</th>
                            <th>Max</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map((d, idx) => {
                            const avgScore = d.AvgScore || 0;
                            const threshold = d.PassingGrade || 87;
                            const isPassing = avgScore >= threshold;
                            const scoreClass = isPassing ? 'pass' : 'fail';
                            const minClass = (d.MinScore || 0) >= threshold ? 'pass' : 'fail';
                            const maxClass = (d.MaxScore || 0) >= threshold ? 'pass' : 'fail';
                            return \`
                                <tr>
                                    <td>\${idx + 1}</td>
                                    <td>\${d.Year}</td>
                                    <td>\${d.StoreName}</td>
                                    <td>\${d.Auditors || 'Unknown'}</td>
                                    <td>\${d.SchemaName || 'N/A'}</td>
                                    <td>\${threshold}%</td>
                                    <td>\${d.AuditCount}</td>
                                    <td class="\${scoreClass}">\${avgScore.toFixed(1)}%</td>
                                    <td class="\${minClass}">\${(d.MinScore || 0).toFixed(1)}%</td>
                                    <td class="\${maxClass}">\${(d.MaxScore || 0).toFixed(1)}%</td>
                                    <td class="pass">\${d.PassedAudits || 0}</td>
                                    <td class="fail">\${d.FailedAudits || 0}</td>
                                    <td><span class="badge \${isPassing ? 'badge-pass' : 'badge-fail'}">\${isPassing ? 'PASS' : 'FAIL'}</span></td>
                                </tr>
                            \`;
                        }).join('')}
                    </tbody>
                </table>
            \`;
        }

        // ============================================
        // PASS/FAIL TAB
        // ============================================
        function renderPassFailTab() {
            renderPassFailByAuditorTable();
            renderPassFailByBranchTable();
        }

        function renderPassFailByAuditorTable() {
            const data = perfData.passFailByAuditor || [];
            if (data.length === 0) {
                document.getElementById('passFailAuditorTable').innerHTML = '<p class="no-data">No data</p>';
                return;
            }

            const sorted = [...data].sort((a, b) => b.TotalAudits - a.TotalAudits);
            document.getElementById('passFailAuditorTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Auditor</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th><th>Avg Score</th></tr></thead>
                    <tbody>\${sorted.map(a => {
                        const passRate = a.TotalAudits > 0 ? ((a.PassedAudits / a.TotalAudits) * 100).toFixed(1) : 0;
                        return \`
                            <tr>
                                <td>\${a.Auditors || 'Unknown'}</td>
                                <td>\${a.TotalAudits}</td>
                                <td class="pass">\${a.PassedAudits}</td>
                                <td class="fail">\${a.FailedAudits}</td>
                                <td class="\${passRate >= 80 ? 'pass' : passRate >= 60 ? 'warn' : 'fail'}">\${passRate}%</td>
                                <td>\${a.AvgScore ? a.AvgScore.toFixed(1) + '%' : '-'}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        function renderPassFailByBranchTable() {
            const data = perfData.passFailByBranch || [];
            if (data.length === 0) {
                document.getElementById('passFailBranchTable').innerHTML = '<p class="no-data">No data</p>';
                return;
            }

            // Get sort options
            const sortField = document.getElementById('branchSortField')?.value || 'storeName';
            const sortOrder = document.getElementById('branchSortOrder')?.value || 'asc';
            const isAsc = sortOrder === 'asc';

            // Calculate rates for sorting
            const dataWithRates = data.map(a => ({
                ...a,
                passRate: a.TotalAudits > 0 ? (a.PassedAudits / a.TotalAudits) * 100 : 0,
                failRate: a.TotalAudits > 0 ? (a.FailedAudits / a.TotalAudits) * 100 : 0
            }));

            // Sort based on selected field and order
            const sorted = [...dataWithRates].sort((a, b) => {
                let comparison = 0;
                switch (sortField) {
                    case 'storeName':
                        comparison = a.StoreName.localeCompare(b.StoreName);
                        break;
                    case 'total':
                        comparison = a.TotalAudits - b.TotalAudits;
                        break;
                    case 'passRate':
                        comparison = a.passRate - b.passRate;
                        break;
                    case 'failRate':
                        comparison = a.failRate - b.failRate;
                        break;
                    case 'avgScore':
                        comparison = (a.AvgScore || 0) - (b.AvgScore || 0);
                        break;
                    default:
                        comparison = a.StoreName.localeCompare(b.StoreName);
                }
                return isAsc ? comparison : -comparison;
            });

            document.getElementById('passFailBranchTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Store</th><th>Auditor</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th><th>Fail Rate</th><th>Avg Score</th></tr></thead>
                    <tbody>\${sorted.map(a => {
                        const passRateClass = a.passRate >= 80 ? 'pass' : a.passRate >= 60 ? 'warn' : 'fail';
                        const failRateClass = a.failRate <= 20 ? 'pass' : a.failRate <= 40 ? 'warn' : 'fail';
                        return \`
                            <tr>
                                <td>\${a.StoreName}</td>
                                <td>\${a.Auditors || 'Unknown'}</td>
                                <td>\${a.TotalAudits}</td>
                                <td class="pass">\${a.PassedAudits}</td>
                                <td class="fail">\${a.FailedAudits}</td>
                                <td class="\${passRateClass}">\${a.passRate.toFixed(1)}%</td>
                                <td class="\${failRateClass}">\${a.failRate.toFixed(1)}%</td>
                                <td>\${a.AvgScore ? a.AvgScore.toFixed(1) + '%' : '-'}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        // ============================================
        // DURATION TAB
        // ============================================
        function renderDurationTab() {
            renderDurationChart();
            renderDurationVarianceTable();
            renderDeviationSummaryTable();
        }

        function renderDurationChart() {
            const ctx = document.getElementById('durationChart').getContext('2d');
            if (durationChart) durationChart.destroy();

            const data = perfData.durationVariance || [];
            const sorted = [...data].sort((a, b) => (b.AvgDurationMinutes || 0) - (a.AvgDurationMinutes || 0));

            // Group by auditor
            const byAuditor = {};
            sorted.forEach(d => {
                const name = d.Auditors || 'Unknown';
                if (!byAuditor[name]) byAuditor[name] = [];
                byAuditor[name].push(d.AvgDurationMinutes || 0);
            });

            const auditors = Object.keys(byAuditor);
            const avgDurations = auditors.map(name => {
                const vals = byAuditor[name];
                return vals.reduce((a, b) => a + b, 0) / vals.length;
            });

            durationChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: auditors,
                    datasets: [{
                        label: 'Avg Duration (minutes)',
                        data: avgDurations,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            title: { display: true, text: 'Minutes' },
                            ticks: {
                                stepSize: 30,
                                autoSkip: false,
                                maxTicksLimit: 20,
                                callback: function(value) {
                                    if (value % 30 === 0) {
                                        return value + ' min';
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    plugins: { legend: { display: false }, datalabels: { display: false } }
                }
            });
        }

        function renderDurationVarianceTable() {
            const data = perfData.durationVariance || [];
            if (data.length === 0) {
                document.getElementById('durationVarianceTable').innerHTML = '<p class="no-data">No duration data</p>';
                return;
            }

            const sorted = [...data].sort((a, b) => a.StoreName.localeCompare(b.StoreName));
            document.getElementById('durationVarianceTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Store</th><th>Auditor</th><th>Audits</th><th>Avg Duration</th><th>Standard</th><th>Variance</th></tr></thead>
                    <tbody>\${sorted.map(d => {
                        const avg = d.AvgDurationMinutes;
                        const std = d.StandardAuditDuration;
                        let variance = null;
                        let varianceClass = 'variance-normal';
                        if (avg != null && std != null) {
                            variance = avg - std;
                            if (variance < -10) varianceClass = 'variance-fast';
                            else if (variance > 10) varianceClass = 'variance-slow';
                        }
                        return \`
                            <tr>
                                <td>\${d.StoreName}</td>
                                <td>\${d.Auditors || 'Unknown'}</td>
                                <td>\${d.AuditCount}</td>
                                <td>\${formatDuration(avg)}</td>
                                <td>\${std ? formatDuration(std) : '<em style="color:#94a3b8">Not set</em>'}</td>
                                <td class="\${varianceClass}">\${variance != null ? (variance > 0 ? '+' : '') + Math.round(variance) + 'm' : '-'}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        function renderDeviationSummaryTable() {
            const data = perfData.durationVariance || [];
            
            // Filter only records with significant deviations (>10 or <-10 minutes)
            const deviations = data.filter(d => {
                if (d.AvgDurationMinutes == null || d.StandardAuditDuration == null) return false;
                const variance = d.AvgDurationMinutes - d.StandardAuditDuration;
                return Math.abs(variance) > 10;
            }).map(d => ({
                ...d,
                variance: d.AvgDurationMinutes - d.StandardAuditDuration
            }));

            if (deviations.length === 0) {
                document.getElementById('deviationSummaryTable').innerHTML = '<p class="no-data">No significant deviations found (±10 minutes threshold)</p>';
                return;
            }

            // Sort by absolute variance descending (biggest deviations first)
            const sorted = [...deviations].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

            document.getElementById('deviationSummaryTable').innerHTML = \`
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Branch</th>
                            <th>Auditor</th>
                            <th>Audits</th>
                            <th>Avg Duration</th>
                            <th>Standard</th>
                            <th>Variance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>\${sorted.map((d, idx) => {
                        const varianceClass = d.variance < 0 ? 'variance-fast' : 'variance-slow';
                        const status = d.variance < 0 ? '🟢 Faster' : '🔴 Slower';
                        return \`
                            <tr>
                                <td>\${idx + 1}</td>
                                <td>\${d.StoreName}</td>
                                <td>\${d.Auditors || 'Unknown'}</td>
                                <td>\${d.AuditCount}</td>
                                <td>\${formatDuration(d.AvgDurationMinutes)}</td>
                                <td>\${formatDuration(d.StandardAuditDuration)}</td>
                                <td class="\${varianceClass}">\${(d.variance > 0 ? '+' : '') + Math.round(d.variance)}m</td>
                                <td>\${status}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        // ============================================
        // SEND TIME TAB
        // ============================================
        function renderSendTimeTab() {
            renderSendTimeChart();
            renderSendTimeTable();
            renderSendTimeDeviationsTable();
        }

        function renderSendTimeChart() {
            const ctx = document.getElementById('sendTimeChart').getContext('2d');
            if (sendTimeChart) sendTimeChart.destroy();

            const data = (perfData.submissionTimes || []).filter(s => s.HoursToSend != null);
            
            // Group by auditor
            const byAuditor = {};
            data.forEach(d => {
                const name = d.Auditors || 'Unknown';
                if (!byAuditor[name]) byAuditor[name] = [];
                byAuditor[name].push(d.HoursToSend);
            });

            const auditors = Object.keys(byAuditor);
            // Convert hours to days
            const avgDays = auditors.map(name => {
                const vals = byAuditor[name];
                const avgHours = vals.reduce((a, b) => a + b, 0) / vals.length;
                return avgHours / 24; // Convert to days
            });

            // 5-day target trendline
            const targetLine = auditors.map(() => 5);

            sendTimeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: auditors,
                    datasets: [
                        {
                            label: 'Avg Days to Send',
                            data: avgDays,
                            backgroundColor: avgDays.map(d => d <= 5 ? '#10b981' : d <= 7 ? '#f59e0b' : '#ef4444'),
                            borderRadius: 4,
                            order: 2
                        },
                        {
                            label: '5-Day Target',
                            data: targetLine,
                            type: 'line',
                            borderColor: '#64748b',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false,
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            title: { display: true, text: 'Days' },
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value + ' days';
                                }
                            }
                        } 
                    },
                    plugins: { 
                        datalabels: { display: false },
                        legend: { 
                            display: true,
                            position: 'top',
                            labels: {
                                filter: function(legendItem) {
                                    // Only show the target line in legend
                                    return legendItem.datasetIndex === 1;
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        const days = context.raw;
                                        const status = days <= 5 ? '✅ On Target' : days <= 7 ? '⚠️ Delayed' : '❌ Late';
                                        return \`Avg: \${days.toFixed(1)} days \${status}\`;
                                    }
                                    return '5-Day Target';
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderSendTimeTable() {
            const data = perfData.submissionTimes || [];
            if (data.length === 0) {
                document.getElementById('sendTimeTable').innerHTML = '<p class="no-data">No submission data</p>';
                return;
            }

            const targetDays = 5;
            // Show recent 50
            const recent = data.slice(0, 50);
            document.getElementById('sendTimeTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Document</th><th>Store</th><th>Auditor</th><th>Audit Date</th><th>Email Sent</th><th>Days to Send</th><th>Target</th><th>Variance</th></tr></thead>
                    <tbody>\${recent.map(d => {
                        const auditDate = d.AuditDate ? new Date(d.AuditDate).toLocaleDateString() : '-';
                        const sentAt = d.FirstNotificationSent ? new Date(d.FirstNotificationSent).toLocaleString() : '<em style="color:#94a3b8">Not sent</em>';
                        const hours = d.HoursToSend;
                        const days = hours != null ? hours / 24 : null;
                        const variance = days != null ? days - targetDays : null;
                        let daysClass = '';
                        let varianceClass = '';
                        if (days != null) {
                            if (days <= 5) daysClass = 'pass';
                            else if (days <= 7) daysClass = 'warn';
                            else daysClass = 'fail';
                        }
                        if (variance != null) {
                            if (variance <= 0) varianceClass = 'variance-fast';
                            else if (variance <= 2) varianceClass = 'variance-normal';
                            else varianceClass = 'variance-slow';
                        }
                        return \`
                            <tr>
                                <td>\${d.DocumentNumber}</td>
                                <td>\${d.StoreName}</td>
                                <td>\${d.Auditors || 'Unknown'}</td>
                                <td>\${auditDate}</td>
                                <td>\${sentAt}</td>
                                <td class="\${daysClass}">\${days != null ? days.toFixed(1) + ' days' : '-'}</td>
                                <td>\${targetDays} days</td>
                                <td class="\${varianceClass}">\${variance != null ? (variance > 0 ? '+' : '') + variance.toFixed(1) + ' days' : '-'}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        function renderSendTimeDeviationsTable() {
            const data = perfData.submissionTimes || [];
            const targetDays = 5;
            
            // Filter only records that exceeded the 5-day target
            const deviations = data.filter(d => {
                if (d.HoursToSend == null) return false;
                const days = d.HoursToSend / 24;
                return days > targetDays;
            }).map(d => ({
                ...d,
                days: d.HoursToSend / 24,
                variance: (d.HoursToSend / 24) - targetDays
            }));

            if (deviations.length === 0) {
                document.getElementById('sendTimeDeviationsTable').innerHTML = '<p class="no-data">No deviations found - all reports sent within 5-day target 🎉</p>';
                return;
            }

            // Sort by variance descending (biggest delays first)
            const sorted = [...deviations].sort((a, b) => b.variance - a.variance);

            document.getElementById('sendTimeDeviationsTable').innerHTML = \`
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Document</th>
                            <th>Store</th>
                            <th>Auditor</th>
                            <th>Audit Date</th>
                            <th>Email Sent</th>
                            <th>Days to Send</th>
                            <th>Target</th>
                            <th>Variance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>\${sorted.map((d, idx) => {
                        const auditDate = d.AuditDate ? new Date(d.AuditDate).toLocaleDateString() : '-';
                        const sentAt = d.FirstNotificationSent ? new Date(d.FirstNotificationSent).toLocaleString() : '-';
                        const varianceClass = d.variance <= 2 ? 'warn' : 'fail';
                        const status = d.variance <= 2 ? '⚠️ Delayed' : '🔴 Late';
                        return \`
                            <tr>
                                <td>\${idx + 1}</td>
                                <td>\${d.DocumentNumber}</td>
                                <td>\${d.StoreName}</td>
                                <td>\${d.Auditors || 'Unknown'}</td>
                                <td>\${auditDate}</td>
                                <td>\${sentAt}</td>
                                <td class="\${varianceClass}">\${d.days.toFixed(1)} days</td>
                                <td>\${targetDays} days</td>
                                <td class="\${varianceClass}">+\${d.variance.toFixed(1)} days</td>
                                <td>\${status}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        // ============================================
        // FINDINGS TAB
        // ============================================
        function renderFindingsTab() {
            renderFindingsAuditorChart();
            renderFindingsTable();
        }

        function renderFindingsAuditorChart() {
            const ctx = document.getElementById('findingsAuditorChart').getContext('2d');
            if (findingsAuditorChart) findingsAuditorChart.destroy();

            const data = perfData.findingsPerStore || [];
            
            // Group by auditor
            const byAuditor = {};
            data.forEach(d => {
                const name = d.Auditors || 'Unknown';
                if (!byAuditor[name]) byAuditor[name] = { total: 0, count: 0 };
                byAuditor[name].total += d.TotalFindings || 0;
                byAuditor[name].count++;
            });

            const auditors = Object.keys(byAuditor);
            const avgFindings = auditors.map(name => byAuditor[name].total / byAuditor[name].count);

            findingsAuditorChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: auditors,
                    datasets: [{
                        label: 'Avg Findings per Audit',
                        data: avgFindings,
                        backgroundColor: '#f59e0b',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false }, datalabels: { display: false } }
                }
            });
        }

        function renderFindingsTable() {
            const data = perfData.findingsPerStore || [];
            if (data.length === 0) {
                document.getElementById('findingsTable').innerHTML = '<p class="no-data">No findings data</p>';
                return;
            }

            // Show recent 50
            const recent = data.slice(0, 50);
            document.getElementById('findingsTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Document</th><th>Store</th><th>Auditor</th><th>Schema</th><th>Findings</th><th>Score</th></tr></thead>
                    <tbody>\${recent.map(d => {
                        const threshold = d.PassingGrade || 87;
                        return \`
                            <tr>
                                <td>\${d.AuditDate ? new Date(d.AuditDate).toLocaleDateString() : '-'}</td>
                                <td>\${d.DocumentNumber}</td>
                                <td>\${d.StoreName}</td>
                                <td>\${d.Auditors || 'Unknown'}</td>
                                <td>\${d.SchemaName || 'N/A'}</td>
                                <td>\${d.TotalFindings || 0}</td>
                                <td class="\${d.TotalScore >= threshold ? 'pass' : 'fail'}">\${d.TotalScore ? d.TotalScore.toFixed(1) + '%' : '-'}</td>
                            </tr>
                        \`;
                    }).join('')}</tbody>
                </table>
            \`;
        }

        // ============================================
        // SETTINGS TAB
        // ============================================
        function renderSettingsTab() {
            const stores = perfData.stores || [];
            if (stores.length === 0) {
                document.getElementById('settingsTable').innerHTML = '<p class="no-data">No stores found</p>';
                return;
            }

            document.getElementById('settingsTable').innerHTML = \`
                <table class="data-table">
                    <thead><tr><th>Store</th><th>Standard Duration (minutes)</th><th>Action</th></tr></thead>
                    <tbody>\${stores.map(s => \`
                        <tr>
                            <td>\${s.StoreName}</td>
                            <td>
                                <input type="number" id="duration-\${s.StoreID}" 
                                       value="\${s.StandardAuditDuration || ''}" 
                                       min="30" max="480" step="5" 
                                       placeholder="e.g., 120">
                            </td>
                            <td>
                                <button class="btn-save" onclick="saveDuration(\${s.StoreID})">Save</button>
                            </td>
                        </tr>
                    \`).join('')}</tbody>
                </table>
            \`;
        }

        async function saveDuration(storeId) {
            const input = document.getElementById('duration-' + storeId);
            const duration = input.value ? parseInt(input.value) : null;

            try {
                const response = await fetch('/api/admin/stores/' + storeId + '/duration', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ duration })
                });

                if (!response.ok) throw new Error('Failed to save');
                
                // Visual feedback
                input.style.borderColor = '#10b981';
                setTimeout(() => { input.style.borderColor = ''; }, 2000);
                
            } catch (error) {
                console.error('Error saving duration:', error);
                alert('Error saving duration: ' + error.message);
            }
        }
    </script>
</body>
</html>
`;

        res.send(html);
    }
}

module.exports = AuditorPerformancePage;
