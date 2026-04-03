/**
 * Admin Analytics Page Module
 * Advanced Analytics Dashboard with charts and visualizations
 * 
 * Features:
 * 1. Trend Charts - Score trends over time by store/auditor
 * 2. Auditor Performance - Compare auditors by # audits, avg scores
 * 3. Section Analysis Report - Drill-down analysis with per-store/audit breakdown and criteria details
 * 4. Heatmap - Visual grid of stores vs sections showing problem areas
 */

class AnalyticsPage {
    /**
     * Render the analytics page
     */
    static render(req, res) {
        const user = req.currentUser;
        const userRole = user.role || 'Admin';
        // Check if user can see Action Plans Reviewed card (Admin, SuperAuditor, HeadOfOperations)
        const canSeeReviewedCard = ['Admin', 'SuperAuditor', 'HeadOfOperations'].includes(userRole);
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Analytics - Food Safety Audit System</title>
    <link rel="stylesheet" href="/admin/styles/analytics.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
</head>
<body>
    <!-- Store user role for JS access -->
    <script>
        const currentUserRole = '${userRole}';
        const canSeeReviewedCard = ${canSeeReviewedCard};
    </script>
    
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo-section">
                <h1>📈 Advanced Analytics</h1>
                <p class="subtitle">Performance insights and audit analytics</p>
            </div>
            <div class="user-section">
                <span class="user-name">${user.displayName || user.email}</span>
                <span class="user-role badge-admin">${userRole}</span>
                <a href="/admin/users" class="btn-secondary">👥 Users</a>
                <a href="/dashboard" class="btn-secondary">Back to Dashboard</a>
                <a href="/auth/logout" class="btn-logout">Logout</a>
            </div>
        </div>
    </header>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading analytics data...</p>
    </div>

    <!-- Main Content -->
    <main class="container">
        <!-- Filter Section - At Top -->
        <section class="filter-section">
            <div class="filter-row">
                <div class="filter-group">
                    <label>Country:</label>
                    <div class="multi-select-dropdown" id="countryDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('countryDropdown')">
                            <span class="selected-text">All Countries</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="countryOptions">
                            <label class="checkbox-option">
                                <input type="checkbox" value="Lebanon" onchange="updateDropdownText('countryDropdown'); onCountryChange()"> 🇱🇧 Lebanon
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="Iraq" onchange="updateDropdownText('countryDropdown'); onCountryChange()"> 🇮🇶 Iraq
                            </label>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Scheme:</label>
                    <div class="multi-select-dropdown" id="schemeDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('schemeDropdown')">
                            <span class="selected-text">All Schemes</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="schemeOptions">
                            <!-- Options populated dynamically from brands -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Stores:</label>
                    <div class="multi-select-dropdown" id="storeDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('storeDropdown')">
                            <span class="selected-text">All Stores</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="storeOptions">
                            <!-- Options populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Management:</label>
                    <div class="multi-select-dropdown" id="headOfOpsDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('headOfOpsDropdown')">
                            <span class="selected-text">All Management</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="headOfOpsOptions">
                            <!-- Options populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="filter-row">
                <div class="filter-group">
                    <label>Area Managers:</label>
                    <div class="multi-select-dropdown" id="areaManagerDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('areaManagerDropdown')">
                            <span class="selected-text">All Area Managers</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="areaManagerOptions">
                            <!-- Options populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Year:</label>
                    <div class="multi-select-dropdown" id="yearDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('yearDropdown')">
                            <span class="selected-text">All Years</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="yearOptions">
                            <!-- Options populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Result:</label>
                    <div class="multi-select-dropdown" id="resultDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('resultDropdown')">
                            <span class="selected-text">All Results</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="resultOptions">
                            <label class="checkbox-option">
                                <input type="checkbox" value="pass" onchange="updateDropdownText('resultDropdown'); refreshAnalytics()"> ✅ Pass
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="fail" onchange="updateDropdownText('resultDropdown'); refreshAnalytics()"> ❌ Fail
                            </label>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Months:</label>
                    <div class="multi-select-dropdown" id="monthDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('monthDropdown')">
                            <span class="selected-text">All Months</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="monthOptions">
                            <label class="checkbox-option">
                                <input type="checkbox" value="1" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> January
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="2" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> February
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="3" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> March
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="4" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> April
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="5" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> May
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="6" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> June
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="7" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> July
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="8" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> August
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="9" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> September
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="10" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> October
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="11" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> November
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" value="12" onchange="updateDropdownText('monthDropdown'); refreshAnalytics()"> December
                            </label>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Cycles:</label>
                    <div class="multi-select-dropdown" id="cycleDropdown">
                        <div class="multi-select-header" onclick="toggleDropdown('cycleDropdown')">
                            <span class="selected-text">All Cycles</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="multi-select-options" id="cycleOptions">
                            <!-- Cycles populated dynamically from cycle management -->
                        </div>
                    </div>
                </div>
                <button class="btn-refresh" onclick="refreshAnalytics()">🔄 Refresh</button>
                <button class="btn-clear" onclick="clearAllFilters()">✖ Clear</button>
                <button class="btn-download-all" onclick="downloadAllAnalytics()">📥 Download All Analytics</button>
            </div>
        </section>

        <!-- Summary Cards -->
        <section class="summary-cards">
            <div class="summary-card">
                <div class="card-icon">📊</div>
                <div class="card-content">
                    <h3 id="totalAudits">-</h3>
                    <p>Total Audits</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">🏪</div>
                <div class="card-content">
                    <h3 id="totalStores">-</h3>
                    <p>Number of Selected Stores</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📈</div>
                <div class="card-content">
                    <h3 id="avgScore">-</h3>
                    <p>Average Score</p>
                </div>
            </div>
            <div class="summary-card pass">
                <div class="card-icon">✅</div>
                <div class="card-content">
                    <h3 id="passRate">-</h3>
                    <p>Pass Rate <span id="passCount" class="rate-count"></span></p>
                </div>
            </div>
            <div class="summary-card fail">
                <div class="card-icon">❌</div>
                <div class="card-content">
                    <h3 id="failRate">-</h3>
                    <p>Fail Rate <span id="failCount" class="rate-count"></span></p>
                </div>
            </div>
            <div class="summary-card">
                <div class="card-icon">📋</div>
                <div class="card-content">
                    <h3 id="actionPlansSubmitted">-</h3>
                    <p>Number of Action Plans Submitted</p>
                </div>
            </div>
            <div class="summary-card clickable" onclick="showUnsolvedActionPlans()" title="Click to view unsolved items">
                <div class="card-icon">📝</div>
                <div class="card-content">
                    <h3 id="actionPlanCompletion">-</h3>
                    <p>Number of Findings Solved</p>
                    <span class="click-hint">Click to view unsolved ➡️</span>
                </div>
            </div>
            ${canSeeReviewedCard ? `
            <div class="summary-card reviewed clickable" onclick="showReviewedActionPlans()" title="Click to view reviewed action plans">
                <div class="card-icon">✅</div>
                <div class="card-content">
                    <h3 id="actionPlansReviewed">-</h3>
                    <p>Action Plans Reviewed</p>
                    <span class="click-hint">Click to view details ➡️</span>
                </div>
            </div>
            ` : ''}
        </section>

        <!-- Custom Query Builder -->
        <section class="query-builder-section">
            <h2>🔍 Custom Query Builder - Ask Your Own Questions</h2>
            <div class="query-builder">
                <div class="query-row">
                    <div class="query-group">
                        <label>I want to see:</label>
                        <select id="querySubject" onchange="updateQueryOptions()">
                            <option value="">-- Select --</option>
                            <option value="stores">🏪 Stores</option>
                            <option value="auditors">👥 Auditors</option>
                            <option value="sections">📋 Sections</option>
                            <option value="items">📝 Checklist Items</option>
                        </select>
                    </div>
                    <div class="query-group">
                        <label>With:</label>
                        <select id="queryMetric">
                            <option value="">-- Select metric --</option>
                            <option value="most_fails">Most Fails</option>
                            <option value="most_audits">Most Audits</option>
                            <option value="lowest_score">Lowest Score</option>
                            <option value="highest_score">Highest Score</option>
                            <option value="most_repetitive">Most Repetitive Issues</option>
                            <option value="never_pass">Never Passed</option>
                            <option value="always_pass">Always Passed</option>
                            <option value="biggest_drop">Biggest Score Drop</option>
                            <option value="biggest_improvement">Biggest Improvement</option>
                        </select>
                    </div>
                    <div class="query-group">
                        <label>Show Top:</label>
                        <select id="queryLimit">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                    <button class="btn-query" onclick="runCustomQuery()">🚀 Run Query</button>
                </div>
                
                <!-- Quick Questions -->
                <div class="quick-questions">
                    <span class="quick-label">Quick Questions:</span>
                    <button class="quick-btn" onclick="quickQuery('stores', 'most_fails')">🏪 Stores with most fails</button>
                    <button class="quick-btn" onclick="quickQuery('items', 'most_repetitive')">📝 Most repetitive failing items</button>
                    <button class="quick-btn" onclick="quickQuery('auditors', 'most_audits')">👥 Most active auditors</button>
                    <button class="quick-btn" onclick="quickQuery('sections', 'lowest_score')">📋 Weakest sections</button>
                    <button class="quick-btn" onclick="quickQuery('stores', 'biggest_improvement')">📈 Most improved stores</button>
                    <button class="quick-btn" onclick="quickQuery('stores', 'never_pass')">❌ Stores that never passed</button>
                </div>
            </div>
            
            <!-- Query Results -->
            <div id="queryResults" class="query-results" style="display: none;">
                <div class="results-header">
                    <h3 id="queryResultsTitle">Results</h3>
                    <button class="btn-export" onclick="exportQueryResults()">📥 Export</button>
                </div>
                <div id="queryResultsChart" class="query-chart-container">
                    <canvas id="customQueryChart"></canvas>
                </div>
                <div id="queryResultsTable" class="query-table-container"></div>
            </div>
        </section>

        <!-- Charts Grid -->
        <div class="charts-grid">
            <!-- Trend Chart -->
            <section class="chart-card full-width" id="scoreTrendsSection">
                <div class="section-header-row">
                    <h2>📈 Score Trends Over Time by Scheme</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionChart('trendChart', 'Score_Trends')" title="Download Chart">📊</button>
                        <button class="btn-export-sm" onclick="exportSectionTable('scoreTrendsSection', 'Score_Trends')" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Average score trends per brand/scheme with target passing grade lines.</p>
                <div class="chart-container large">
                    <canvas id="trendChart"></canvas>
                </div>
                
                <!-- Passing and Failing Branches Tables -->
                <div class="branches-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div class="branches-table-container">
                        <h3 style="color: #16a34a; margin-bottom: 10px;">✅ Passing Branches</h3>
                        <div id="passingBranchesTable" class="data-table-container">
                            <p class="loading-text">Loading...</p>
                        </div>
                    </div>
                    <div class="branches-table-container">
                        <h3 style="color: #dc2626; margin-bottom: 10px;">❌ Failing Branches</h3>
                        <div id="failingBranchesTable" class="data-table-container">
                            <p class="loading-text">Loading...</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Category Analysis Report -->
            <section class="chart-card full-width" id="categoryAnalysisSection">
                <div class="section-header-row">
                    <h2>📂 Category Analysis Report</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionChart('categoryChart', 'Category_Analysis')" title="Download Chart">📊</button>
                        <button class="btn-export-sm" onclick="exportSectionTable('categoryAnalysisSection', 'Category_Analysis')" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Performance analysis by main categories (e.g., Storage of Food, Employees' Food Handling). Categories vary per audit scheme.</p>
                <div class="category-analysis-controls">
                    <label>Filter by Scheme:</label>
                    <select id="categorySchemeFilter" onchange="filterCategoryAnalysis()">
                        <option value="">All Schemes</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="categoryChart"></canvas>
                </div>
                <div id="categoryTable" class="data-table-container"></div>
            </section>

            <!-- Section/Subcategory Analysis -->
            <section class="chart-card full-width" id="sectionAnalysisSection">
                <div class="section-header-row">
                    <h2>📊 Section Analysis Report (Subcategories)</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionChart('sectionChart', 'Section_Analysis')" title="Download Chart">📊</button>
                        <button class="btn-export-sm" onclick="exportSectionTable('sectionAnalysisSection', 'Section_Analysis')" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Performance analysis by sections/subcategories within each category.</p>
                <div class="section-analysis-controls">
                    <label>Filter by Scheme:</label>
                    <select id="sectionSchemeFilter" onchange="filterSectionAnalysis()">
                        <option value="">All Schemes</option>
                    </select>
                    <label>Filter by Category:</label>
                    <select id="sectionCategoryFilter" onchange="filterSectionAnalysis()">
                        <option value="">All Categories</option>
                    </select>
                    <label>Sort By:</label>
                    <select id="sectionSortMode" onchange="filterSectionAnalysis()">
                        <option value="score">Average Score (Weakest First)</option>
                        <option value="category">Category, then Score</option>
                        <option value="name">Section Name (A-Z)</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="sectionChart"></canvas>
                </div>
                <div id="sectionTable" class="data-table-container"></div>
            </section>

            <!-- Heatmap -->
            <section class="chart-card full-width" id="storePerformanceSection">
                <div class="section-header-row">
                    <h2>🗺️ Store Performance by Cycle</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionTable('storePerformanceSection', 'Store_Performance')" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Track store progress across cycles. Compare performance evolution per scheme.</p>
                <div class="heatmap-controls">
                    <div class="heatmap-view-toggle">
                        <label>Filter by Scheme:</label>
                        <select id="heatmapSchemeFilter" onchange="filterHeatmapByScheme()">
                            <option value="">All Schemes</option>
                        </select>
                    </div>
                </div>
                <div class="heatmap-container" id="heatmapContainer">
                    <p class="loading-text">Loading...</p>
                </div>
            </section>

            <!-- Action Plan Analysis -->
            <section class="chart-card full-width" id="actionPlanSection">
                <div class="section-header-row">
                    <h2>📝 Action Plan Analysis</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionTable('actionPlanSection', 'Action_Plan_Analysis')" title="Download Excel">📥</button>
                    </div>
                </div>
                
                <!-- Summary Stats -->
                <div id="apSummaryStats" class="nc-summary-stats">
                    <p class="loading-text">Loading...</p>
                </div>
                
                <!-- Non-conformities by Location -->
                <div class="nc-section">
                    <h3>📍 Non-conformities by Location</h3>
                    <div id="ncByLocationTable" class="data-table-container">
                        <p class="loading-text">Loading data...</p>
                    </div>
                </div>
                
                <!-- Open Non-conformities by Location -->
                <div class="nc-section">
                    <h3>⏳ Open Non-conformities by Location</h3>
                    <p class="nc-description">Open findings with days since creation.</p>
                    <div id="openNCByLocationTable" class="data-table-container">
                        <p class="loading-text">Loading data...</p>
                    </div>
                </div>
            </section>

            <!-- Non-conformities Analysis -->
            <section class="chart-card full-width" id="ncAnalysisSection">
                <div class="section-header-row">
                    <h2>🚫 Non-conformities Analysis</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionTable('ncAnalysisSection', 'NC_Analysis')" title="Download Excel">📥</button>
                    </div>
                </div>
                
                <!-- Scheme Filter -->
                <div class="nc-filter-bar">
                    <label for="ncSchemeFilter">Filter by Scheme:</label>
                    <select id="ncSchemeFilter" onchange="filterNCByScheme()">
                        <option value="">All Schemes</option>
                    </select>
                </div>
                
                <!-- Audits with N/C Summary Table -->
                <div class="nc-section">
                    <h3>📋 Audits Summary</h3>
                    <div id="ncAuditTable" class="data-table-container">
                        <p class="loading-text">Loading audit data...</p>
                    </div>
                </div>
                
                <!-- Repetitive Findings -->
                <div class="nc-section">
                    <h3>🔄 Repetitive Findings (Across All Cycles)</h3>
                    <p class="nc-description">Findings that appear in multiple audits for the same store at the same reference point.</p>
                    <div id="repetitiveFindingsTable" class="data-table-container">
                        <p class="loading-text">Loading repetitive findings...</p>
                    </div>
                </div>
            </section>

            <!-- Branch Rankings -->
            <section class="chart-card full-width" id="branchRankingsSection">
                <div class="section-header-row">
                    <h2>🏆 Branch Rankings</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionTable('branchRankingsSection', 'Branch_Rankings')" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Top 3 and Bottom 3 performing branches by scheme and cycle.</p>
                <div id="branchRankingsTable" class="data-table-container">
                    <p class="loading-text">Loading rankings...</p>
                </div>
            </section>

            <!-- Average Store Scores Chart -->
            <section class="chart-card full-width" id="storeScoresSection">
                <div class="section-header-row">
                    <h2 id="storeScoresChartTitle">📊 Average Food Safety Audits Per Store</h2>
                    <div class="section-export-btns">
                        <button class="btn-export-sm" onclick="exportSectionChart('storeScoresChart', 'Store_Scores')" title="Download Chart">📊</button>
                        <button class="btn-export-sm" onclick="exportStoreScoresTable()" title="Download Excel">📥</button>
                    </div>
                </div>
                <p class="section-description">Store performance with target passing grade line.</p>
                <div class="chart-container store-scores-chart">
                    <canvas id="storeScoresChart"></canvas>
                </div>
            </section>
        </div>
    </main>

    <!-- Unsolved Action Plans Modal -->
    <div id="unsolvedModal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>📝 Unsolved Action Plan Items</h2>
                <button class="modal-close" onclick="closeUnsolvedModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-filters">
                    <input type="text" id="unsolvedSearch" placeholder="🔍 Search store, question, finding..." oninput="filterUnsolvedItems()">
                    <select id="unsolvedPriorityFilter" onchange="filterUnsolvedItems()">
                        <option value="">All Priorities</option>
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                    </select>
                    <select id="unsolvedStatusFilter" onchange="filterUnsolvedItems()">
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Deferred">Deferred</option>
                    </select>
                </div>
                <div class="modal-stats">
                    <span id="unsolvedCount">Loading...</span>
                </div>
                <div class="unsolved-table-container" id="unsolvedTableContainer">
                    <p class="loading-text">Loading unsolved items...</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Reviewed Action Plans Modal -->
    <div id="reviewedModal" class="modal-overlay" style="display: none;">
        <div class="modal-content modal-large">
            <div class="modal-header" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                <h2>👁️ Action Plans Reviewed by Area Managers</h2>
                <button class="modal-close" onclick="closeReviewedModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-filters">
                    <input type="text" id="reviewedSearch" placeholder="🔍 Search store, document..." oninput="filterReviewedItems()">
                </div>
                <div class="modal-stats">
                    <span id="reviewedCount">Loading...</span>
                </div>
                <div class="unsolved-table-container" id="reviewedTableContainer">
                    <p class="loading-text">Loading reviewed action plans...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Chart instances
        let trendChart = null;
        let sectionChart = null;

        // Data cache
        let analyticsData = null;

        // Initialize page
        document.addEventListener('DOMContentLoaded', async () => {
            await initFilters();
            await loadAnalytics();
        });

        // Unsolved action plans data
        let unsolvedItems = [];

        // Show unsolved action plans modal
        async function showUnsolvedActionPlans() {
            document.getElementById('unsolvedModal').style.display = 'flex';
            document.getElementById('unsolvedTableContainer').innerHTML = '<p class="loading-text">Loading unsolved items...</p>';
            
            try {
                const filters = getFilters();
                const queryParams = new URLSearchParams(filters).toString();
                const response = await fetch('/api/admin/analytics/unsolved-action-plans?' + queryParams);
                const data = await response.json();
                
                if (data.success) {
                    unsolvedItems = data.items;
                    document.getElementById('unsolvedCount').textContent = data.count + ' unsolved items';
                    renderUnsolvedTable(unsolvedItems);
                } else {
                    document.getElementById('unsolvedTableContainer').innerHTML = '<p class="error-text">Error loading data</p>';
                }
            } catch (error) {
                console.error('Error loading unsolved items:', error);
                document.getElementById('unsolvedTableContainer').innerHTML = '<p class="error-text">Error: ' + error.message + '</p>';
            }
        }

        // Close modal
        function closeUnsolvedModal() {
            document.getElementById('unsolvedModal').style.display = 'none';
        }

        // Filter unsolved items
        function filterUnsolvedItems() {
            const search = document.getElementById('unsolvedSearch').value.toLowerCase();
            const priority = document.getElementById('unsolvedPriorityFilter').value;
            const status = document.getElementById('unsolvedStatusFilter').value;
            
            const filtered = unsolvedItems.filter(item => {
                const matchesSearch = !search || 
                    (item.StoreName || '').toLowerCase().includes(search) ||
                    (item.SectionName || '').toLowerCase().includes(search) ||
                    (item.Finding || '').toLowerCase().includes(search) ||
                    (item.DocumentNumber || '').toLowerCase().includes(search) ||
                    (item.PersonInCharge || '').toLowerCase().includes(search);
                const matchesPriority = !priority || item.Priority === priority;
                const matchesStatus = !status || item.Status === status;
                return matchesSearch && matchesPriority && matchesStatus;
            });
            
            document.getElementById('unsolvedCount').textContent = filtered.length + ' of ' + unsolvedItems.length + ' items';
            renderUnsolvedTable(filtered);
        }

        // Render unsolved table
        function renderUnsolvedTable(items) {
            if (items.length === 0) {
                document.getElementById('unsolvedTableContainer').innerHTML = '<p class="empty-text">🎉 No unsolved action plan items found!</p>';
                return;
            }
            
            const html = \`
                <table class="unsolved-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Document</th>
                            <th>Section</th>
                            <th>Ref</th>
                            <th>Finding</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Person In Charge</th>
                            <th>Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${items.map(item => \`
                            <tr class="priority-\${(item.Priority || 'none').toLowerCase()}">
                                <td>\${item.StoreName || '-'}</td>
                                <td>\${item.DocumentNumber || '-'}</td>
                                <td>\${item.SectionName || '-'}</td>
                                <td>\${item.ReferenceValue || '-'}</td>
                                <td class="finding-cell" title="\${item.Finding || ''}">\${truncate(item.Finding, 50)}</td>
                                <td><span class="priority-badge priority-\${(item.Priority || 'none').toLowerCase()}">\${item.Priority || 'N/A'}</span></td>
                                <td><span class="status-badge status-\${(item.Status || 'open').toLowerCase().replace(' ', '-')}">\${item.Status || 'Open'}</span></td>
                                <td>\${item.PersonInCharge || '-'}</td>
                                <td>\${item.Deadline ? new Date(item.Deadline).toLocaleDateString() : '-'}</td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
            document.getElementById('unsolvedTableContainer').innerHTML = html;
        }

        // Truncate text helper
        function truncate(text, maxLength) {
            if (!text) return '-';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }

        // Close modal on overlay click
        document.getElementById('unsolvedModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'unsolvedModal') closeUnsolvedModal();
        });

        // ===== Reviewed Action Plans Modal =====
        let reviewedItems = [];

        // Show reviewed action plans modal
        async function showReviewedActionPlans() {
            document.getElementById('reviewedModal').style.display = 'flex';
            document.getElementById('reviewedTableContainer').innerHTML = '<p class="loading-text">Loading reviewed action plans...</p>';
            
            try {
                const filters = getFilters();
                const queryParams = new URLSearchParams(filters).toString();
                const response = await fetch('/api/admin/analytics/reviewed-action-plans?' + queryParams);
                const data = await response.json();
                
                if (data.success) {
                    reviewedItems = data.items;
                    document.getElementById('reviewedCount').textContent = data.count + ' action plans reviewed';
                    renderReviewedTable(reviewedItems);
                } else {
                    document.getElementById('reviewedTableContainer').innerHTML = '<p class="error-text">Error loading data</p>';
                }
            } catch (error) {
                console.error('Error loading reviewed items:', error);
                document.getElementById('reviewedTableContainer').innerHTML = '<p class="error-text">Error: ' + error.message + '</p>';
            }
        }

        // Close reviewed modal
        function closeReviewedModal() {
            document.getElementById('reviewedModal').style.display = 'none';
        }

        // Filter reviewed items
        function filterReviewedItems() {
            const search = document.getElementById('reviewedSearch').value.toLowerCase();
            
            const filtered = reviewedItems.filter(item => {
                return !search || 
                    (item.StoreName || '').toLowerCase().includes(search) ||
                    (item.DocumentNumber || '').toLowerCase().includes(search) ||
                    (item.SubmittedBy || '').toLowerCase().includes(search);
            });
            
            document.getElementById('reviewedCount').textContent = filtered.length + ' of ' + reviewedItems.length + ' items';
            renderReviewedTable(filtered);
        }

        // Render reviewed table
        function renderReviewedTable(items) {
            if (items.length === 0) {
                document.getElementById('reviewedTableContainer').innerHTML = '<p class="empty-text">No reviewed action plans found.</p>';
                return;
            }
            
            const html = \`
                <table class="unsolved-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Document</th>
                            <th>Submitted By</th>
                            <th>Submitted Date</th>
                            <th>Area Manager Reviewed</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${items.map(item => \`
                            <tr>
                                <td>\${item.StoreName || '-'}</td>
                                <td><a href="/reports/\${item.DocumentNumber}.html" target="_blank" class="report-link">\${item.DocumentNumber || '-'}</a></td>
                                <td>\${item.SubmittedBy || '-'}</td>
                                <td>\${item.SubmittedDate ? new Date(item.SubmittedDate).toLocaleDateString() : '-'}</td>
                                <td>\${item.AreaManagerReviewed || '<span style="color: #94a3b8;">No Area Manager</span>'}</td>
                                <td><a href="/auditor/action-plan?doc=\${item.DocumentNumber}" target="_blank" class="btn-small">View Action Plan</a></td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
            document.getElementById('reviewedTableContainer').innerHTML = html;
        }

        // Close reviewed modal on overlay click
        document.getElementById('reviewedModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'reviewedModal') closeReviewedModal();
        });

        // Global store list for filtering
        let allStores = [];
        let allHeadOfOps = [];
        let allAreaManagers = [];

        // Initialize filter dropdowns
        async function initFilters() {
            try {
                console.log('Initializing filters...');
                
                // Load brands (now called Schemes)
                const brandsResponse = await fetch('/api/admin/brands');
                console.log('Brands/Schemes response:', brandsResponse.status);
                if (brandsResponse.ok) {
                    const brands = await brandsResponse.json();
                    console.log('Loaded schemes:', brands);
                    const schemeOptions = document.getElementById('schemeOptions');
                    schemeOptions.innerHTML = '';
                    brands.forEach(brand => {
                        const label = document.createElement('label');
                        label.className = 'checkbox-option';
                        label.innerHTML = \`
                            <input type="checkbox" value="\${brand}" onchange="updateDropdownText('schemeDropdown'); onSchemeChange()"> \${brand}
                        \`;
                        schemeOptions.appendChild(label);
                    });
                } else {
                    console.error('Failed to load schemes:', brandsResponse.status);
                }

                // Load stores
                const storesResponse = await fetch('/api/admin/stores');
                console.log('Stores response status:', storesResponse.status);
                if (storesResponse.ok) {
                    const storesData = await storesResponse.json();
                    // Handle both array and {stores: [...]} formats
                    allStores = Array.isArray(storesData) ? storesData : (storesData.stores || []);
                    console.log('Loaded stores:', allStores.length, 'First store:', allStores[0]);
                    populateStoreDropdown(allStores);
                } else {
                    console.error('Failed to load stores:', await storesResponse.text());
                }

                // Load Head of Operations
                try {
                    const headOfOpsResponse = await fetch('/api/admin/head-of-operations');
                    if (headOfOpsResponse.ok) {
                        allHeadOfOps = await headOfOpsResponse.json();
                        populateHeadOfOpsDropdown(allHeadOfOps);
                    }
                } catch (e) {
                    console.warn('Could not load Head of Operations:', e);
                }

                // Load Area Managers
                try {
                    const areaManagersResponse = await fetch('/api/admin/area-managers');
                    if (areaManagersResponse.ok) {
                        allAreaManagers = await areaManagersResponse.json();
                        populateAreaManagerDropdown(allAreaManagers);
                    }
                } catch (e) {
                    console.warn('Could not load Area Managers:', e);
                }

                // Load Cycles from cycle management
                try {
                    const cyclesResponse = await fetch('/api/admin/cycles');
                    if (cyclesResponse.ok) {
                        const cycles = await cyclesResponse.json();
                        populateCycleDropdown(cycles);
                    }
                } catch (e) {
                    console.warn('Could not load cycles:', e);
                }

                // Load years
                const currentYear = new Date().getFullYear();
                const yearOptions = document.getElementById('yearOptions');
                yearOptions.innerHTML = '';
                for (let y = currentYear; y >= currentYear - 5; y--) {
                    const label = document.createElement('label');
                    label.className = 'checkbox-option';
                    label.innerHTML = \`
                        <input type="checkbox" value="\${y}" onchange="updateDropdownText('yearDropdown'); refreshAnalytics()"> \${y}
                    \`;
                    yearOptions.appendChild(label);
                }
                
                // Apply default filters based on year
                // For 2026: Start from C3 (March) - skip C1 and C2
                // For 2027+: Start from C1 (January) - no filtering needed
                applyDefaultYearFilters();
                
            } catch (error) {
                console.error('Error initializing filters:', error);
            }
        }
        
        // Apply default year-based filters
        // 2026: Analytics starts from C3 (March)
        // 2027+: Analytics starts from C1 (January)
        function applyDefaultYearFilters() {
            const currentYear = new Date().getFullYear();
            
            // Pre-select current year
            const yearCheckbox = document.querySelector(\`#yearOptions input[value="\${currentYear}"]\`);
            if (yearCheckbox) {
                yearCheckbox.checked = true;
                updateDropdownText('yearDropdown');
            }
            
            // For 2026, pre-select cycles C3 onwards (skip C1, C2)
            if (currentYear === 2026) {
                const cycleCheckboxes = document.querySelectorAll('#cycleOptions input[type="checkbox"]');
                const selectedCycles = [];
                cycleCheckboxes.forEach(cb => {
                    const cycleValue = cb.value;
                    // Check if cycle is C3 or higher (C3, C4, C5, ... C12)
                    const cycleMatch = cycleValue.match(/C(\\d+)/i);
                    if (cycleMatch) {
                        const cycleNum = parseInt(cycleMatch[1]);
                        if (cycleNum >= 3) {
                            cb.checked = true;
                            selectedCycles.push(cycleValue);
                        }
                    }
                });
                updateDropdownText('cycleDropdown');
                console.log('📅 2026 default filters applied: Selected cycles:', selectedCycles);
            } else {
                // For 2027+, no cycle filtering - all cycles from January
                console.log('📅 ' + currentYear + ' default filters: All cycles from January');
            }
        }

        // Populate Cycle dropdown
        function populateCycleDropdown(cycles) {
            const options = document.getElementById('cycleOptions');
            options.innerHTML = '';
            cycles.forEach(cycle => {
                const label = document.createElement('label');
                label.className = 'checkbox-option';
                label.innerHTML = \`
                    <input type="checkbox" value="\${cycle}" onchange="updateDropdownText('cycleDropdown'); refreshAnalytics()"> \${cycle}
                \`;
                options.appendChild(label);
            });
            updateDropdownText('cycleDropdown');
        }

        // Populate Head of Operations dropdown
        function populateHeadOfOpsDropdown(headOfOps) {
            const options = document.getElementById('headOfOpsOptions');
            options.innerHTML = '';
            headOfOps.forEach(person => {
                const label = document.createElement('label');
                label.className = 'checkbox-option';
                const name = person.display_name || person.displayName || person.name || 'Unknown';
                const id = person.id || person.user_id || person.userId;
                label.innerHTML = \`
                    <input type="checkbox" value="\${id}" onchange="updateDropdownText('headOfOpsDropdown'); refreshAnalytics()"> \${name}
                \`;
                options.appendChild(label);
            });
            updateDropdownText('headOfOpsDropdown');
        }

        // Populate Area Manager dropdown
        function populateAreaManagerDropdown(areaManagers) {
            const options = document.getElementById('areaManagerOptions');
            options.innerHTML = '';
            areaManagers.forEach(person => {
                const label = document.createElement('label');
                label.className = 'checkbox-option';
                const name = person.display_name || person.displayName || person.name || 'Unknown';
                const id = person.id || person.user_id || person.userId;
                label.innerHTML = \`
                    <input type="checkbox" value="\${id}" onchange="updateDropdownText('areaManagerDropdown'); refreshAnalytics()"> \${name}
                \`;
                options.appendChild(label);
            });
            updateDropdownText('areaManagerDropdown');
        }

        // Populate store dropdown with filtered stores
        function populateStoreDropdown(stores) {
            const storeOptions = document.getElementById('storeOptions');
            storeOptions.innerHTML = ''; // Clear existing
            
            stores.forEach(store => {
                const label = document.createElement('label');
                label.className = 'checkbox-option';
                const storeId = store.store_id || store.StoreID || store.storeId;
                const storeName = store.store_name || store.StoreName || store.storeName || 'Unknown';
                const brand = store.brand || store.Brand || '';
                const displayName = brand ? storeName + ' (' + brand + ')' : storeName;
                label.innerHTML = \`
                    <input type="checkbox" value="\${storeId}" onchange="updateDropdownText('storeDropdown'); refreshAnalytics()"> \${displayName}
                \`;
                storeOptions.appendChild(label);
            });
            
            updateDropdownText('storeDropdown');
        }

        // Filter stores when scheme (brand) changes
        function onSchemeChange() {
            const schemeCheckboxes = document.querySelectorAll('#schemeOptions input[type="checkbox"]:checked');
            const selectedSchemes = Array.from(schemeCheckboxes).map(cb => cb.value);
            
            if (selectedSchemes.length > 0) {
                const filteredStores = allStores.filter(store => 
                    selectedSchemes.includes(store.Brand || store.brand)
                );
                populateStoreDropdown(filteredStores);
            } else {
                populateStoreDropdown(allStores);
            }
            
            refreshAnalytics();
        }

        // Filter when country changes
        function onCountryChange() {
            const countryCheckboxes = document.querySelectorAll('#countryOptions input[type="checkbox"]:checked');
            const selectedCountries = Array.from(countryCheckboxes).map(cb => cb.value);
            
            if (selectedCountries.length > 0) {
                const filteredStores = allStores.filter(store => 
                    selectedCountries.includes(store.Country || store.country)
                );
                populateStoreDropdown(filteredStores);
            } else {
                populateStoreDropdown(allStores);
            }
            
            refreshAnalytics();
        }

        // Clear all filters
        function clearAllFilters() {
            // Uncheck all checkboxes in all dropdowns
            document.querySelectorAll('.multi-select-options input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            // Reset dropdown texts
            ['countryDropdown', 'schemeDropdown', 'storeDropdown', 'headOfOpsDropdown', 'areaManagerDropdown', 
             'resultDropdown', 'yearDropdown', 'monthDropdown', 'cycleDropdown'].forEach(id => {
                updateDropdownText(id);
            });
            
            // Repopulate stores
            populateStoreDropdown(allStores);
            
            refreshAnalytics();
        }

        // Get current filter values
        function getFilters() {
            // Get multiple selected countries
            const countryCheckboxes = document.querySelectorAll('#countryOptions input[type="checkbox"]:checked');
            const selectedCountries = Array.from(countryCheckboxes).map(cb => cb.value);
            
            // Get multiple selected schemes (formerly brands)
            const schemeCheckboxes = document.querySelectorAll('#schemeOptions input[type="checkbox"]:checked');
            const selectedSchemes = Array.from(schemeCheckboxes).map(cb => cb.value);
            
            // Get multiple selected store IDs from checkboxes
            const storeCheckboxes = document.querySelectorAll('#storeOptions input[type="checkbox"]:checked');
            const selectedStores = Array.from(storeCheckboxes).map(cb => cb.value);
            
            // Get multiple selected Head of Operations
            const headOfOpsCheckboxes = document.querySelectorAll('#headOfOpsOptions input[type="checkbox"]:checked');
            const selectedHeadOfOps = Array.from(headOfOpsCheckboxes).map(cb => cb.value);
            
            // Get multiple selected Area Managers
            const areaManagerCheckboxes = document.querySelectorAll('#areaManagerOptions input[type="checkbox"]:checked');
            const selectedAreaManagers = Array.from(areaManagerCheckboxes).map(cb => cb.value);
            
            // Get multiple selected results
            const resultCheckboxes = document.querySelectorAll('#resultOptions input[type="checkbox"]:checked');
            const selectedResults = Array.from(resultCheckboxes).map(cb => cb.value);
            
            // Get multiple selected years
            const yearCheckboxes = document.querySelectorAll('#yearOptions input[type="checkbox"]:checked');
            const selectedYears = Array.from(yearCheckboxes).map(cb => cb.value);
            
            // Get multiple selected months from checkboxes
            const monthCheckboxes = document.querySelectorAll('#monthOptions input[type="checkbox"]:checked');
            const selectedMonths = Array.from(monthCheckboxes).map(cb => cb.value);
            
            // Get multiple selected cycles from checkboxes
            const cycleCheckboxes = document.querySelectorAll('#cycleOptions input[type="checkbox"]:checked');
            const selectedCycles = Array.from(cycleCheckboxes).map(cb => cb.value);
            
            return {
                countries: selectedCountries.join(','),
                brands: selectedSchemes.join(','),  // API still uses 'brands' param
                storeIds: selectedStores.join(','),
                headOfOpsIds: selectedHeadOfOps.join(','),
                areaManagerIds: selectedAreaManagers.join(','),
                results: selectedResults.join(','),
                years: selectedYears.join(','),
                months: selectedMonths.join(','),
                cycles: selectedCycles.join(',')
            };
        }

        // Toggle multi-select dropdown
        function toggleDropdown(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            const options = dropdown.querySelector('.multi-select-options');
            const isOpen = options.classList.contains('open');
            
            // Close all other dropdowns first
            document.querySelectorAll('.multi-select-options.open').forEach(el => {
                el.classList.remove('open');
            });
            
            if (!isOpen) {
                options.classList.add('open');
            }
        }

        // Update dropdown header text based on selections
        function updateDropdownText(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
            const textSpan = dropdown.querySelector('.selected-text');
            
            const defaultTexts = {
                'countryDropdown': 'All Countries',
                'schemeDropdown': 'All Schemes',
                'storeDropdown': 'All Stores',
                'headOfOpsDropdown': 'All Head of Ops',
                'areaManagerDropdown': 'All Area Managers',
                'resultDropdown': 'All Results',
                'yearDropdown': 'All Years',
                'monthDropdown': 'All Months',
                'cycleDropdown': 'All Cycles'
            };
            
            if (checkboxes.length === 0) {
                textSpan.textContent = defaultTexts[dropdownId] || 'All';
            } else if (checkboxes.length === 1) {
                textSpan.textContent = checkboxes[0].parentElement.textContent.trim();
            } else {
                textSpan.textContent = checkboxes.length + ' selected';
            }
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.multi-select-dropdown')) {
                document.querySelectorAll('.multi-select-options.open').forEach(el => {
                    el.classList.remove('open');
                });
            }
        });

        // Load all analytics data
        async function loadAnalytics() {
            showLoading(true);
            try {
                const filters = getFilters();
                console.log('📊 Loading analytics with filters:', filters);
                const queryParams = new URLSearchParams(filters).toString();
                console.log('📊 Query params:', queryParams);

                const response = await fetch('/api/admin/analytics?' + queryParams);
                if (!response.ok) throw new Error('Failed to load analytics');
                
                analyticsData = await response.json();
                console.log('📊 Action plan data:', {
                    total: analyticsData.summary.actionPlansTotal,
                    solved: analyticsData.summary.actionPlansSolved
                });
                
                renderSummaryCards(analyticsData.summary);
                renderTrendChartByBrand(analyticsData.trendsByBrand, analyticsData.trends);
                renderPassingFailingBranches(analyticsData.passingBranches, analyticsData.failingBranches);
                renderCategoryAnalysis(analyticsData.categoryAnalysis, analyticsData.categorySchemes);
                renderSectionAnalysis(analyticsData.sectionWeakness, analyticsData.sectionDrilldown, analyticsData.sectionSchemes, analyticsData.sectionCategories);
                renderHeatmap(analyticsData.heatmap);
                renderNCAnalysis(analyticsData.ncAnalysis);
                renderBranchRankings(analyticsData.branchRankings);
                renderActionPlanAnalysis(analyticsData.actionPlanAnalysis);
                renderStoreScoresChart(analyticsData.heatmap, analyticsData.summary.passingThreshold);
            } catch (error) {
                console.error('Error loading analytics:', error);
                alert('Error loading analytics: ' + error.message);
            } finally {
                showLoading(false);
            }
        }

        // Refresh analytics with current filters
        function refreshAnalytics() {
            loadAnalytics();
        }

        // Show/hide loading overlay
        function showLoading(show) {
            document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
        }

        // Render summary cards
        function renderSummaryCards(summary) {
            const totalAudits = summary.totalAudits || 0;
            const failedAudits = summary.failedAudits || 0;
            const passedAudits = totalAudits - failedAudits;
            const passRate = summary.passRate || 0;
            const failRate = totalAudits > 0 ? (failedAudits * 100.0 / totalAudits) : 0;
            
            document.getElementById('totalAudits').textContent = totalAudits;
            document.getElementById('totalStores').textContent = summary.totalStores || 0;
            document.getElementById('avgScore').textContent = (summary.avgScore || 0).toFixed(1) + '%';
            
            // Pass Rate with count (e.g., "85.5%" with "10/12" below)
            document.getElementById('passRate').textContent = passRate.toFixed(1) + '%';
            document.getElementById('passCount').textContent = '(' + passedAudits + '/' + totalAudits + ')';
            
            // Fail Rate with count (e.g., "14.5%" with "2/12" below)
            document.getElementById('failRate').textContent = failRate.toFixed(1) + '%';
            document.getElementById('failCount').textContent = '(' + failedAudits + '/' + totalAudits + ')';
            
            // Action Plans Submitted (unique audits with action plan responses)
            const submitted = summary.actionPlansSubmittedCount || 0;
            document.getElementById('actionPlansSubmitted').textContent = submitted;
            
            // Action Plan Completion: show as "X/Y (Z%)"
            const solved = summary.actionPlansSolved || 0;
            const total = summary.actionPlansTotal || 0;
            const percentage = summary.actionPlanCompletionRate || 0;
            console.log('📊 Rendering Action Plan card: solved=' + solved + ', total=' + total);
            if (total > 0) {
                document.getElementById('actionPlanCompletion').textContent = solved + '/' + total + ' (' + percentage.toFixed(1) + '%)';
            } else {
                document.getElementById('actionPlanCompletion').textContent = '0/0 (0%)';
            }
            
            // Action Plans Reviewed (only visible for certain roles)
            const reviewedElement = document.getElementById('actionPlansReviewed');
            if (reviewedElement) {
                reviewedElement.textContent = summary.actionPlansReviewed || 0;
            }
        }

        // Render trend chart by brand with target lines - vertical bars with score labels
        function renderTrendChartByBrand(trendsByBrand, fallbackTrends) {
            const ctx = document.getElementById('trendChart').getContext('2d');
            
            if (trendChart) trendChart.destroy();

            // Pastel color palette for bars
            const brandColors = {
                'Spinneys': { bar: '#86efac', bg: 'rgba(134, 239, 172, 0.7)', target: '#22c55e' },
                'Happy': { bar: '#fcd34d', bg: 'rgba(252, 211, 77, 0.7)', target: '#f59e0b' },
                'GNG': { bar: '#93c5fd', bg: 'rgba(147, 197, 253, 0.7)', target: '#3b82f6' },
                'Noknok': { bar: '#c4b5fd', bg: 'rgba(196, 181, 253, 0.7)', target: '#8b5cf6' },
                'Cold Stone': { bar: '#f9a8d4', bg: 'rgba(249, 168, 212, 0.7)', target: '#ec4899' },
                'Thai Express': { bar: '#67e8f9', bg: 'rgba(103, 232, 249, 0.7)', target: '#06b6d4' },
                'Catering - El Estez': { bar: '#fdba74', bg: 'rgba(253, 186, 116, 0.7)', target: '#f97316' },
                'Catering - Pizzarte': { bar: '#bef264', bg: 'rgba(190, 242, 100, 0.7)', target: '#84cc16' },
                'Catering - AUB': { bar: '#5eead4', bg: 'rgba(94, 234, 212, 0.7)', target: '#14b8a6' },
                'Catering - Pate et Pain': { bar: '#d8b4fe', bg: 'rgba(216, 180, 254, 0.7)', target: '#a855f7' },
                'Food Avenue': { bar: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.7)', target: '#64748b' },
                'Signature - By the Sea': { bar: '#7dd3fc', bg: 'rgba(125, 211, 252, 0.7)', target: '#0ea5e9' }
            };

            // Default pastel colors for brands not in the map
            const defaultColors = [
                { bar: '#fca5a5', bg: 'rgba(252, 165, 165, 0.7)', target: '#ef4444' },
                { bar: '#6ee7b7', bg: 'rgba(110, 231, 183, 0.7)', target: '#10b981' },
                { bar: '#a5b4fc', bg: 'rgba(165, 180, 252, 0.7)', target: '#6366f1' },
                { bar: '#f9a8d4', bg: 'rgba(249, 168, 212, 0.7)', target: '#f472b6' }
            ];

            // If no brand-specific data, fall back to overall trend
            if (!trendsByBrand || trendsByBrand.length === 0) {
                const labels = fallbackTrends.map(t => t.period);
                const scores = fallbackTrends.map(t => t.avgScore);
                
                trendChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Average Score (%)',
                            data: scores,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            barPercentage: 0.5,
                            categoryPercentage: 0.7,
                            maxBarThickness: 40
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { min: 0, max: 100, title: { display: true, text: 'Score (%)' } }
                        },
                        plugins: {
                            legend: { position: 'top' }
                        }
                    }
                });
                return;
            }

            // Get all unique periods across all brands
            const allPeriods = new Set();
            trendsByBrand.forEach(brand => {
                brand.data.forEach(d => allPeriods.add(d.period));
            });
            const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
                const [yearA, cycleA] = a.split('-');
                const [yearB, cycleB] = b.split('-');
                if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                // Sort cycles: C1, C2, ... C12
                const numA = parseInt(cycleA.replace('C', ''));
                const numB = parseInt(cycleB.replace('C', ''));
                return numA - numB;
            });

            const datasets = [];
            let colorIndex = 0;

            // Create BAR datasets for each brand (score values)
            trendsByBrand.forEach(brand => {
                const color = brandColors[brand.brand] || defaultColors[colorIndex % defaultColors.length];
                colorIndex++;

                // Map data to periods (fill gaps with null)
                const dataMap = {};
                brand.data.forEach(d => {
                    dataMap[d.period] = d.avgScore;
                });
                const dataPoints = sortedPeriods.map(p => dataMap[p] !== undefined ? dataMap[p] : null);

                // Score bars
                datasets.push({
                    label: brand.brand,
                    data: dataPoints,
                    backgroundColor: color.bg,
                    borderColor: color.bar,
                    borderWidth: 1,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7,
                    maxBarThickness: 40,
                    passingGrade: brand.passingGrade,
                    order: 2
                });
            });

            // Add target line datasets (dashed horizontal line for each brand)
            colorIndex = 0;
            trendsByBrand.forEach(brand => {
                const color = brandColors[brand.brand] || defaultColors[colorIndex % defaultColors.length];
                colorIndex++;
                datasets.push({
                    label: brand.brand + ' Target (' + brand.passingGrade + '%)',
                    data: sortedPeriods.map(() => brand.passingGrade),
                    type: 'line',
                    borderColor: color.target || color.bar,
                    borderDash: [8, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    order: 1
                });
            });

            trendChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedPeriods,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Score (%)' },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            title: { display: true, text: 'Cycle' }
                        }
                    },
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 20,
                                padding: 15,
                                font: {
                                    size: 11
                                },
                                generateLabels: function(chart) {
                                    const datasets = chart.data.datasets;
                                    return datasets.map((dataset, i) => {
                                        const label = dataset.label || '';
                                        const isTarget = label.includes('Target');
                                        return {
                                            text: label,
                                            fillStyle: isTarget ? 'transparent' : dataset.backgroundColor,
                                            strokeStyle: isTarget ? dataset.borderColor : dataset.borderColor,
                                            lineWidth: isTarget ? 2 : 1,
                                            lineDash: isTarget ? [8, 4] : [],
                                            hidden: !chart.isDatasetVisible(i),
                                            index: i,
                                            pointStyle: isTarget ? 'line' : 'rect'
                                        };
                                    });
                                }
                            },
                            onClick: function(e, legendItem, legend) {
                                const index = legendItem.index;
                                const chart = legend.chart;
                                chart.setDatasetVisibility(index, !chart.isDatasetVisible(index));
                                chart.update();
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                title: function(tooltipItems) {
                                    if (!tooltipItems || !tooltipItems[0]) return '';
                                    return 'Cycle: ' + tooltipItems[0].label;
                                },
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    if (!context.parsed || context.parsed.y === null || context.parsed.y === undefined) {
                                        return label + ': No data';
                                    }
                                    if (label.includes('Target')) {
                                        return '🎯 ' + label;
                                    }
                                    const passingGrade = context.dataset.passingGrade || 87;
                                    const score = context.parsed.y;
                                    const status = score >= passingGrade ? '✅ PASS' : '❌ FAIL';
                                    return label + ': ' + score.toFixed(1) + '% ' + status;
                                },
                                afterBody: function(tooltipItems) {
                                    if (!tooltipItems) return [];
                                    // Find bars only (not target lines)
                                    const bars = tooltipItems.filter(item => {
                                        const label = item.dataset.label || '';
                                        return !label.includes('Target') && item.parsed && item.parsed.y !== null;
                                    });
                                    if (bars.length > 1) {
                                        const scores = bars.map(b => b.parsed.y);
                                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                                        return ['', '📊 Average across schemes: ' + avg.toFixed(1) + '%'];
                                    }
                                    return [];
                                }
                            }
                        },
                        // Data labels plugin - show score on each bar
                        datalabels: {
                            display: function(context) {
                                // Only show labels for bars (not target lines)
                                if (!context.dataset) return false;
                                if (context.dataset.type === 'line') return false;
                                const label = context.dataset.label || '';
                                if (label.includes('Target')) return false;
                                if (!context.parsed || context.parsed.y === null || context.parsed.y === undefined) return false;
                                return true;
                            },
                            anchor: 'end',
                            align: 'top',
                            color: '#333',
                            font: {
                                weight: 'bold',
                                size: 10
                            },
                            formatter: function(value) {
                                if (value === null || value === undefined) return '';
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        }

        // Legacy render function (kept for compatibility)
        function renderTrendChart(trends) {
            renderTrendChartByBrand(null, trends);
        }

        // Render Passing and Failing Branches tables
        function renderPassingFailingBranches(passingBranches, failingBranches) {
            const passingContainer = document.getElementById('passingBranchesTable');
            const failingContainer = document.getElementById('failingBranchesTable');
            
            // Render Passing Branches
            if (!passingBranches || passingBranches.length === 0) {
                passingContainer.innerHTML = '<p class="no-data">No passing branches found</p>';
            } else {
                passingContainer.innerHTML = \`
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>Branch</th>
                                <th>Scheme</th>
                                <th>Score</th>
                                <th>Audits</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${passingBranches.map(b => \`
                                <tr>
                                    <td>\${b.storeName}</td>
                                    <td><span class="scheme-badge">\${b.brand || '-'}</span></td>
                                    <td class="pass"><strong>\${b.avgScore.toFixed(1)}%</strong></td>
                                    <td>\${b.auditCount}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                    <p class="table-summary">Total: \${passingBranches.length} passing branches</p>
                \`;
            }
            
            // Render Failing Branches
            if (!failingBranches || failingBranches.length === 0) {
                failingContainer.innerHTML = '<p class="no-data">No failing branches found 🎉</p>';
            } else {
                failingContainer.innerHTML = \`
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>Branch</th>
                                <th>Scheme</th>
                                <th>Score</th>
                                <th>Audits</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${failingBranches.map(b => \`
                                <tr>
                                    <td>\${b.storeName}</td>
                                    <td><span class="scheme-badge">\${b.brand || '-'}</span></td>
                                    <td class="fail"><strong>\${b.avgScore.toFixed(1)}%</strong></td>
                                    <td>\${b.auditCount}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                    <p class="table-summary" style="color: #dc2626;">Total: \${failingBranches.length} failing branches</p>
                \`;
            }
        }

        // =============================================
        // CATEGORY ANALYSIS
        // =============================================
        
        let categoryChart = null;
        let currentCategoryData = [];
        let currentCategorySchemes = [];
        
        function renderCategoryAnalysis(categories, schemes) {
            currentCategoryData = categories || [];
            currentCategorySchemes = schemes || [];
            
            // Populate scheme filter dropdown
            const schemeFilter = document.getElementById('categorySchemeFilter');
            if (schemeFilter) {
                schemeFilter.innerHTML = '<option value="">All Schemes</option>' +
                    currentCategorySchemes.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
            }
            
            renderCategoryTables(currentCategoryData);
        }
        
        function filterCategoryAnalysis() {
            const selectedScheme = document.getElementById('categorySchemeFilter').value;
            
            let filtered = currentCategoryData;
            if (selectedScheme) {
                filtered = currentCategoryData.filter(c => c.schemaName === selectedScheme);
            }
            
            renderCategoryTables(filtered);
        }
        
        function renderCategoryTables(categories) {
            const ctx = document.getElementById('categoryChart').getContext('2d');
            
            if (categoryChart) categoryChart.destroy();
            
            if (!categories || categories.length === 0) {
                document.getElementById('categoryTable').innerHTML = '<p class="no-data">No category data available</p>';
                return;
            }
            
            // Sort by average score (weakest first)
            const sorted = [...categories].sort((a, b) => a.avgScore - b.avgScore);
            
            const labels = sorted.map(c => c.categoryName + ' (' + c.schemaName + ')');
            const scores = sorted.map(c => c.avgScore);
            const colors = scores.map(s => s >= 83 ? '#10b981' : '#ef4444');
            
            categoryChart = new Chart(ctx, {
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
                        x: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Average Score (%)' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const cat = sorted[context.dataIndex];
                                    return [
                                        'Avg Score: ' + cat.avgScore.toFixed(1) + '%',
                                        'Pass Rate: ' + (cat.passRate || 0).toFixed(1) + '%',
                                        'Fail Rate: ' + cat.failRate.toFixed(1) + '%',
                                        'Audits: ' + cat.timesAudited
                                    ];
                                }
                            }
                        }
                    }
                }
            });
            
            // Render category table
            const tableHtml = \`
                <table class="data-table category-analysis-table">
                    <thead>
                        <tr>
                            <th>Scheme</th>
                            <th>Category</th>
                            <th>Audits</th>
                            <th>Average Score</th>
                            <th>Pass Rate</th>
                            <th>Fail Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map(c => {
                            const passCount = Math.round(c.timesAudited * (c.passRate || 0) / 100);
                            const failCount = c.timesAudited - passCount;
                            return \`
                            <tr>
                                <td><span class="scheme-badge">\${c.schemaName}</span></td>
                                <td><strong>\${c.categoryName}</strong></td>
                                <td>\${c.timesAudited}</td>
                                <td class="\${c.avgScore >= 83 ? 'pass' : 'fail'}">\${c.avgScore.toFixed(1)}%</td>
                                <td class="pass">\${(c.passRate || 0).toFixed(1)}% <span class="rate-count">(\${passCount})</span></td>
                                <td class="fail">\${c.failRate.toFixed(1)}% <span class="rate-count">(\${failCount})</span></td>
                            </tr>
                        \`;}).join('')}
                    </tbody>
                </table>
            \`;
            document.getElementById('categoryTable').innerHTML = tableHtml;
        }

        // =============================================
        // SECTION ANALYSIS (SUBCATEGORIES)
        // =============================================
        
        // Store drilldown data for section analysis
        let currentSectionDrilldown = {};
        let currentSectionData = [];
        let currentSectionSchemes = [];
        let currentSectionCategories = [];

        // Handle section sort mode change (deprecated - now uses filterSectionAnalysis)
        function changeSectionSort() {
            filterSectionAnalysis();
        }
        
        function filterSectionAnalysis() {
            if (currentSectionData.length === 0) return;
            
            const selectedScheme = document.getElementById('sectionSchemeFilter')?.value || '';
            const selectedCategory = document.getElementById('sectionCategoryFilter')?.value || '';
            
            let filtered = currentSectionData;
            
            if (selectedScheme) {
                filtered = filtered.filter(s => s.schemaName === selectedScheme);
            }
            if (selectedCategory) {
                filtered = filtered.filter(s => s.categoryName === selectedCategory);
            }
            
            renderSectionTables(filtered, currentSectionDrilldown);
        }

        // Render section analysis report (enhanced version)
        function renderSectionAnalysis(sections, drilldown, schemes, categories) {
            currentSectionDrilldown = drilldown || {};
            currentSectionData = sections || [];
            currentSectionSchemes = schemes || [];
            currentSectionCategories = categories || [];
            
            // Populate scheme filter dropdown
            const schemeFilter = document.getElementById('sectionSchemeFilter');
            if (schemeFilter) {
                schemeFilter.innerHTML = '<option value="">All Schemes</option>' +
                    currentSectionSchemes.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
            }
            
            // Populate category filter dropdown
            const categoryFilter = document.getElementById('sectionCategoryFilter');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' +
                    currentSectionCategories.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
            }
            
            renderSectionTables(currentSectionData, currentSectionDrilldown);
        }
        
        function renderSectionTables(sections, drilldown) {
            const ctx = document.getElementById('sectionChart').getContext('2d');
            
            if (sectionChart) sectionChart.destroy();
            
            // Get sort mode
            const sortMode = document.getElementById('sectionSortMode')?.value || 'score';

            // Sort based on selected mode
            let sorted;
            if (sortMode === 'category') {
                // Sort by category first, then by score within category
                sorted = [...sections].sort((a, b) => {
                    const catA = (a.categoryName || 'Uncategorized').toLowerCase();
                    const catB = (b.categoryName || 'Uncategorized').toLowerCase();
                    if (catA !== catB) return catA.localeCompare(catB);
                    return a.avgScore - b.avgScore;
                });
            } else if (sortMode === 'name') {
                // Sort by section name alphabetically
                sorted = [...sections].sort((a, b) => a.sectionName.localeCompare(b.sectionName));
            } else {
                // Default: sort by average score (weakest first)
                sorted = [...sections].sort((a, b) => a.avgScore - b.avgScore);
            }
            
            const labels = sorted.map(s => s.sectionName);
            const scores = sorted.map(s => s.avgScore);

            const colors = scores.map(s => s >= 83 ? '#10b981' : '#ef4444');

            sectionChart = new Chart(ctx, {
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
                        x: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Average Score (%)' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const section = sorted[context.dataIndex];
                                    return [
                                        'Avg Score: ' + section.avgScore.toFixed(1) + '%',
                                        'Pass Rate: ' + (section.passRate || 0).toFixed(1) + '%',
                                        'Fail Rate: ' + section.failRate.toFixed(1) + '%',
                                        'Times Audited: ' + section.timesAudited
                                    ];
                                }
                            }
                        }
                    }
                }
            });

            // Render enhanced table with expandable rows
            const tableHtml = \`
                <table class="data-table section-analysis-table">
                    <thead>
                        <tr>
                            <th style="width: 30px;"></th>
                            <th>Scheme</th>
                            <th>Category</th>
                            <th>Section (Subcategory)</th>
                            <th>Audits</th>
                            <th>Average Score</th>
                            <th>Pass Rate</th>
                            <th>Fail Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${sorted.map((s, idx) => {
                            const drilldownData = currentSectionDrilldown[s.sectionName] || [];
                            const hasStores = drilldownData.length > 0;
                            const passCount = Math.round(s.timesAudited * (s.passRate || 0) / 100);
                            const failCount = s.timesAudited - passCount;
                            return \`
                            <tr class="section-row \${hasStores ? 'expandable' : ''}" data-section="\${s.sectionName}" onclick="toggleSectionDrilldown('\${s.sectionName.replace(/'/g, "\\\\'")}')">
                                <td class="expand-icon">\${hasStores ? '▶' : ''}</td>
                                <td><span class="scheme-badge">\${s.schemaName || 'Unknown'}</span></td>
                                <td class="category-cell"><span class="category-badge">\${s.categoryName || 'Uncategorized'}</span></td>
                                <td><strong>\${s.sectionName}</strong></td>
                                <td>\${s.timesAudited}</td>
                                <td class="\${s.avgScore >= 83 ? 'pass' : 'fail'}">\${s.avgScore.toFixed(1)}%</td>
                                <td class="pass">\${(s.passRate || 0).toFixed(1)}% <span class="rate-count">(\${passCount})</span></td>
                                <td class="fail">\${s.failRate.toFixed(1)}% <span class="rate-count">(\${failCount})</span></td>
                            </tr>
                            <tr class="drilldown-row" id="drilldown-\${s.sectionName.replace(/[^a-zA-Z0-9]/g, '_')}" style="display: none;">
                                <td colspan="8" class="drilldown-cell">
                                    <div class="drilldown-content">
                                        <div class="drilldown-header">
                                            <strong>Store/Audit Breakdown for \${s.sectionName}</strong>
                                            <button class="btn-small" onclick="event.stopPropagation(); loadSectionCriteria('\${s.sectionName.replace(/'/g, "\\\\'")}')">
                                                📋 View Criteria Details
                                            </button>
                                        </div>
                                        \${drilldownData.length > 0 ? \`
                                        <table class="drilldown-table">
                                            <thead>
                                                <tr>
                                                    <th>Store</th>
                                                    <th>Document #</th>
                                                    <th>Audit Date</th>
                                                    <th>Score</th>
                                                    <th>Earned/Max</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                \${drilldownData.map(d => \`
                                                <tr>
                                                    <td>\${d.storeName}</td>
                                                    <td><a href="/reports/\${d.documentNumber}.html" target="_blank">\${d.documentNumber}</a></td>
                                                    <td>\${new Date(d.auditDate).toLocaleDateString()}</td>
                                                    <td class="\${d.score >= 83 ? 'pass' : 'fail'}">\${d.score ? d.score.toFixed(1) : 0}%</td>
                                                    <td>\${d.earnedScore || 0}/\${d.maxScore || 0}</td>
                                                </tr>
                                                \`).join('')}
                                            </tbody>
                                        </table>
                                        \` : '<p class="no-data">No detailed data available</p>'}
                                    </div>
                                </td>
                            </tr>
                        \`;}).join('')}
                    </tbody>
                </table>
            \`;
            document.getElementById('sectionTable').innerHTML = tableHtml;
        }

        // Toggle section drilldown row
        function toggleSectionDrilldown(sectionName) {
            const rowId = 'drilldown-' + sectionName.replace(/[^a-zA-Z0-9]/g, '_');
            const row = document.getElementById(rowId);
            const sectionRow = document.querySelector(\`tr[data-section="\${sectionName}"]\`);
            const icon = sectionRow?.querySelector('.expand-icon');
            
            if (row) {
                if (row.style.display === 'none') {
                    row.style.display = 'table-row';
                    if (icon) icon.textContent = '▼';
                } else {
                    row.style.display = 'none';
                    if (icon) icon.textContent = '▶';
                }
            }
        }

        // Load criteria details for a section
        async function loadSectionCriteria(sectionName) {
            try {
                const drilldownData = currentSectionDrilldown[sectionName] || [];
                const auditIds = drilldownData.map(d => d.auditId).join(',');
                
                const params = new URLSearchParams({ sectionName });
                if (auditIds) params.append('auditIds', auditIds);
                
                const response = await fetch('/api/admin/analytics/section-criteria?' + params.toString());
                if (!response.ok) throw new Error('Failed to load criteria');
                
                const data = await response.json();
                showCriteriaModal(sectionName, data.criteria);
                
            } catch (error) {
                console.error('Error loading criteria:', error);
                alert('Error loading criteria: ' + error.message);
            }
        }

        // Show criteria modal
        function showCriteriaModal(sectionName, criteria) {
            // Remove existing modal if present
            const existingModal = document.getElementById('criteriaModal');
            if (existingModal) existingModal.remove();
            
            const modalHtml = \`
                <div id="criteriaModal" class="modal-overlay" onclick="closeCriteriaModal(event)">
                    <div class="modal-content modal-large" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>📋 Criteria Analysis: \${sectionName}</h2>
                            <button class="modal-close" onclick="closeCriteriaModal()">✕</button>
                        </div>
                        <div class="modal-body">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 60px;">Ref</th>
                                        <th>Criteria/Question</th>
                                        <th style="width: 60px;">Weight</th>
                                        <th style="width: 80px;">Avg Score</th>
                                        <th style="width: 80px;">Pass Rate</th>
                                        <th style="width: 80px;">Fail Rate</th>
                                        <th style="width: 120px;">Responses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${criteria.map(c => {
                                        const passRate = 100 - (c.failRate || 0);
                                        const totalResponses = c.yesCount + c.partiallyCount + c.noCount;
                                        return \`
                                        <tr>
                                            <td>\${c.referenceValue || '-'}</td>
                                            <td style="text-align: left; max-width: 400px;">\${c.title}</td>
                                            <td>\${c.weight || 2}</td>
                                            <td class="\${c.avgScore >= 83 ? 'pass' : 'fail'}">\${c.avgScore ? c.avgScore.toFixed(1) : 0}%</td>
                                            <td class="pass">\${passRate.toFixed(1)}%</td>
                                            <td class="\${c.failRate > 20 ? 'fail' : ''}">\${(c.failRate || 0).toFixed(1)}%</td>
                                            <td>
                                                <span class="response-badge yes">✓\${c.yesCount}</span>
                                                <span class="response-badge partial">½\${c.partiallyCount}</span>
                                                <span class="response-badge no">✗\${c.noCount}</span>
                                                \${c.naCount > 0 ? \`<span class="response-badge na">NA\${c.naCount}</span>\` : ''}
                                            </td>
                                        </tr>
                                        \`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        // Close criteria modal
        function closeCriteriaModal(event) {
            if (event && event.target !== event.currentTarget) return;
            const modal = document.getElementById('criteriaModal');
            if (modal) modal.remove();
        }

        // Store heatmap data globally for filtering
        let currentHeatmapData = null;

        // Filter heatmap by scheme
        function filterHeatmapByScheme() {
            renderHeatmap(currentHeatmapData);
        }

        // Render heatmap - Store Performance by Cycle with Scheme
        function renderHeatmap(heatmapData) {
            currentHeatmapData = heatmapData;
            const container = document.getElementById('heatmapContainer');
            
            if (!heatmapData || !heatmapData.stores || heatmapData.stores.length === 0) {
                container.innerHTML = '<p class="no-data">No data available</p>';
                return;
            }
            
            const { stores, cycles, schemes } = heatmapData;
            
            // Populate scheme filter dropdown
            const schemeFilter = document.getElementById('heatmapSchemeFilter');
            if (schemeFilter && schemes) {
                const currentValue = schemeFilter.value;
                schemeFilter.innerHTML = '<option value="">All Schemes</option>' +
                    schemes.map(s => \`<option value="\${s}" \${s === currentValue ? 'selected' : ''}>\${s}</option>\`).join('');
            }
            
            // Filter by selected scheme
            const selectedScheme = schemeFilter?.value || '';
            let filteredStores = stores;
            if (selectedScheme) {
                filteredStores = stores.filter(s => s.schemaName === selectedScheme);
            }
            
            if (filteredStores.length === 0) {
                container.innerHTML = '<p class="no-data">No stores found for selected scheme</p>';
                return;
            }
            
            // Sort stores by scheme then store name
            filteredStores.sort((a, b) => {
                if (a.schemaName !== b.schemaName) return a.schemaName.localeCompare(b.schemaName);
                return a.storeName.localeCompare(b.storeName);
            });
            
            // Build table header with cycles
            let html = \`
                <div class="heatmap-scroll">
                    <table class="heatmap-table performance-by-cycle">
                        <thead>
                            <tr>
                                <th class="scheme-header">Scheme</th>
                                <th class="store-header">Store</th>
                                \${cycles.map(c => \`<th class="cycle-header">\${c}</th>\`).join('')}
                                <th class="overall-header">Average</th>
                                <th class="trend-header">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
            \`;
            
            filteredStores.forEach(store => {
                const cycleScores = cycles.map(c => store.cycles[c]);
                
                // Calculate trend (comparing last two available cycles)
                const availableScores = cycleScores.filter(s => s !== undefined);
                let trendIcon = '-';
                let trendClass = '';
                if (availableScores.length >= 2) {
                    const lastScore = availableScores[availableScores.length - 1];
                    const prevScore = availableScores[availableScores.length - 2];
                    const diff = lastScore - prevScore;
                    if (diff > 2) {
                        trendIcon = '📈 +' + diff.toFixed(0) + '%';
                        trendClass = 'trend-up';
                    } else if (diff < -2) {
                        trendIcon = '📉 ' + diff.toFixed(0) + '%';
                        trendClass = 'trend-down';
                    } else {
                        trendIcon = '➡️ ' + (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%';
                        trendClass = 'trend-stable';
                    }
                }
                
                html += \`
                    <tr>
                        <td class="scheme-cell"><span class="scheme-badge">\${store.schemaName}</span></td>
                        <td class="store-name">\${store.storeName}</td>
                \`;
                
                // Show score for each cycle
                cycles.forEach(cycle => {
                    const score = store.cycles[cycle];
                    const cellClass = score !== undefined 
                        ? (score >= 83 ? 'cell-pass' : 'cell-fail')
                        : 'cell-na';
                    const displayScore = score !== undefined ? score.toFixed(0) + '%' : '-';
                    html += \`<td class="heatmap-cell \${cellClass}" title="\${store.storeName}: \${cycle} - \${displayScore}">\${displayScore}</td>\`;
                });
                
                // Average
                const avgClass = store.avgScore >= 83 ? 'cell-pass' : 'cell-fail';
                html += \`<td class="heatmap-cell \${avgClass} overall-cell"><strong>\${store.avgScore.toFixed(0)}%</strong></td>\`;
                
                // Trend
                html += \`<td class="trend-cell \${trendClass}">\${trendIcon}</td>\`;
                html += \`</tr>\`;
            });
            
            html += \`
                        </tbody>
                    </table>
                </div>
                <div class="heatmap-legend">
                    <span class="legend-item"><span class="legend-color cell-pass"></span> Pass (≥83%)</span>
                    <span class="legend-item"><span class="legend-color cell-fail"></span> Fail (<83%)</span>
                    <span class="legend-item"><span class="legend-color cell-na"></span> No Data</span>
                    <span class="legend-item trend-up">📈 Improving</span>
                    <span class="legend-item trend-down">📉 Declining</span>
                    <span class="legend-item trend-stable">➡️ Stable</span>
                </div>
            \`;
            
            container.innerHTML = html;
        }

        // Render compliance calendar
        function renderComplianceCalendar(calendarData) {
            const container = document.getElementById('calendarContainer');
            
            if (!calendarData || calendarData.length === 0) {
                container.innerHTML = '<p class="no-data">No compliance data available</p>';
                return;
            }

            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const sixtyDaysAgo = new Date(today);
            sixtyDaysAgo.setDate(today.getDate() - 60);

            let html = \`
                <div class="calendar-grid">
                    \${calendarData.map(store => {
                        const lastAudit = store.lastAuditDate ? new Date(store.lastAuditDate) : null;
                        let statusClass = 'status-danger';
                        let statusText = 'Never audited';
                        let daysSince = null;

                        if (lastAudit) {
                            daysSince = Math.floor((today - lastAudit) / (1000 * 60 * 60 * 24));
                            if (daysSince <= 30) {
                                statusClass = 'status-good';
                                statusText = daysSince + ' days ago';
                            } else if (daysSince <= 60) {
                                statusClass = 'status-warning';
                                statusText = daysSince + ' days ago';
                            } else {
                                statusClass = 'status-danger';
                                statusText = daysSince + ' days ago';
                            }
                        }

                        return \`
                            <div class="calendar-card \${statusClass}">
                                <div class="store-icon">🏪</div>
                                <h3>\${store.storeName}</h3>
                                <p class="last-audit-date">\${lastAudit ? lastAudit.toLocaleDateString() : 'Never'}</p>
                                <p class="status-text">\${statusText}</p>
                                <p class="audit-count">\${store.totalAudits || 0} total audits</p>
                                \${store.lastScore !== null ? \`<p class="last-score \${store.lastScore >= 83 ? 'pass' : 'fail'}">Last: \${store.lastScore}%</p>\` : ''}
                            </div>
                        \`;
                    }).join('')}
                </div>
                <div class="calendar-legend">
                    <span class="legend-item"><span class="legend-dot status-good"></span> Audited within 30 days</span>
                    <span class="legend-item"><span class="legend-dot status-warning"></span> 31-60 days ago</span>
                    <span class="legend-item"><span class="legend-dot status-danger"></span> Over 60 days / Never</span>
                </div>
            \`;

            container.innerHTML = html;
        }

        // =============================================
        // NON-CONFORMITIES ANALYSIS
        // =============================================
        
        // Store NC data globally for filtering
        let ncAnalysisData = null;
        
        function renderNCAnalysis(ncAnalysis) {
            if (!ncAnalysis) {
                document.getElementById('ncAuditTable').innerHTML = '<p class="no-data">No data available</p>';
                document.getElementById('repetitiveFindingsTable').innerHTML = '<p class="no-data">No data available</p>';
                return;
            }
            
            // Store data globally for filtering
            ncAnalysisData = ncAnalysis;
            
            // Populate scheme filter dropdown
            const schemeFilter = document.getElementById('ncSchemeFilter');
            if (schemeFilter && ncAnalysis.schemes) {
                schemeFilter.innerHTML = '<option value="">All Schemes</option>' +
                    ncAnalysis.schemes.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
            }
            
            // Render with all data initially
            renderNCTables(ncAnalysis.audits, ncAnalysis.repetitiveFindings);
        }
        
        function filterNCByScheme() {
            if (!ncAnalysisData) return;
            
            const selectedScheme = document.getElementById('ncSchemeFilter').value;
            
            let filteredAudits = ncAnalysisData.audits;
            let filteredFindings = ncAnalysisData.repetitiveFindings;
            
            if (selectedScheme) {
                filteredAudits = ncAnalysisData.audits.filter(a => a.scheme === selectedScheme);
                filteredFindings = ncAnalysisData.repetitiveFindings.filter(f => f.scheme === selectedScheme);
            }
            
            renderNCTables(filteredAudits, filteredFindings);
        }
        
        // Format cycles to show consecutive streak ending with most recent
        // e.g., "C1, C2, C3, C4" → "C1-C2-C3-C4" (all consecutive)
        // e.g., "C1, C3, C4, C5" → "C3-C4-C5" (only consecutive ending with latest)
        function formatConsecutiveCycles(cyclesStr) {
            if (!cyclesStr) return '-';
            
            // Parse cycles like "C1, C2, C3" into numbers
            const cycles = cyclesStr.split(', ').map(c => {
                const match = c.match(/C(\d+)/i);
                return match ? parseInt(match[1]) : null;
            }).filter(n => n !== null).sort((a, b) => a - b);
            
            if (cycles.length === 0) return cyclesStr;
            if (cycles.length === 1) return 'C' + cycles[0];
            
            // Find consecutive streak ending with the most recent (last) cycle
            const lastCycle = cycles[cycles.length - 1];
            let streakStart = lastCycle;
            
            // Walk backwards to find where the consecutive streak starts
            for (let i = cycles.length - 2; i >= 0; i--) {
                if (cycles[i] === cycles[i + 1] - 1) {
                    streakStart = cycles[i];
                } else {
                    break;
                }
            }
            
            // Build the streak string
            if (streakStart === lastCycle) {
                // No consecutive cycles, just show the last one
                return 'C' + lastCycle;
            }
            
            // Format as C1-C2-C3-C4
            const streakCycles = [];
            for (let c = streakStart; c <= lastCycle; c++) {
                streakCycles.push('C' + c);
            }
            return streakCycles.join('-');
        }
        
        function renderNCTables(audits, repetitiveFindings) {
            // Calculate summary for filtered data
            const summary = {
                totalAudits: audits.length,
                totalNC: audits.reduce((sum, a) => sum + a.ncCount, 0),
                avgNCPerAudit: audits.length > 0 ? (audits.reduce((sum, a) => sum + a.ncCount, 0) / audits.length).toFixed(1) : 0,
                totalRepetitiveFindings: repetitiveFindings.length,
                storesWithRepetitive: [...new Set(repetitiveFindings.map(r => r.storeName))].length
            };
            
            // Render Audits Summary Table
            let auditsHtml = \`
                <div class="nc-summary-stats">
                    <div class="nc-stat">
                        <span class="nc-stat-value">\${summary.totalAudits}</span>
                        <span class="nc-stat-label">Total Audits</span>
                    </div>
                    <div class="nc-stat">
                        <span class="nc-stat-value">\${summary.totalNC}</span>
                        <span class="nc-stat-label">Total N/C</span>
                    </div>
                    <div class="nc-stat">
                        <span class="nc-stat-value">\${summary.avgNCPerAudit}</span>
                        <span class="nc-stat-label">Avg N/C per Audit</span>
                    </div>
                </div>
                <table class="data-table nc-audit-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Scheme</th>
                            <th>Audit #</th>
                            <th>Report</th>
                            <th>Date</th>
                            <th>Cycle</th>
                            <th>Result</th>
                            <th>Score</th>
                            <th>N/C</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${audits.length > 0 ? audits.map(a => \`
                            <tr>
                                <td>\${a.storeName}</td>
                                <td class="scheme-cell">\${a.scheme || '-'}</td>
                                <td>\${a.documentNumber}</td>
                                <td><a href="/reports/\${a.documentNumber}.html" target="_blank" class="report-link">📄 View</a></td>
                                <td>\${new Date(a.auditDate).toLocaleDateString()}</td>
                                <td>\${a.cycle || '-'}</td>
                                <td class="\${a.result === 'Pass' ? 'pass' : 'fail'}">\${a.result}</td>
                                <td class="\${a.score >= 83 ? 'pass' : 'fail'}">\${a.score ? a.score.toFixed(1) : 0}%</td>
                                <td class="nc-count \${a.ncCount > 10 ? 'high' : a.ncCount > 5 ? 'medium' : ''}">\${a.ncCount}</td>
                            </tr>
                        \`).join('') : '<tr><td colspan="9" class="no-data">No audits found</td></tr>'}
                    </tbody>
                </table>
            \`;
            document.getElementById('ncAuditTable').innerHTML = auditsHtml;
            
            // Render Repetitive Findings Table
            let repetitiveHtml = \`
                <div class="nc-summary-stats">
                    <div class="nc-stat">
                        <span class="nc-stat-value">\${summary.totalRepetitiveFindings}</span>
                        <span class="nc-stat-label">Repetitive Findings</span>
                    </div>
                    <div class="nc-stat">
                        <span class="nc-stat-value">\${summary.storesWithRepetitive}</span>
                        <span class="nc-stat-label">Stores Affected</span>
                    </div>
                </div>
                <table class="data-table repetitive-findings-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Scheme</th>
                            <th>Ref #</th>
                            <th>Section</th>
                            <th>Finding</th>
                            <th>Occurrences</th>
                            <th>Cycles</th>
                            <th>Documents</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${repetitiveFindings.length > 0 ? repetitiveFindings.map(r => \`
                            <tr class="repetitive-row \${r.occurrenceCount >= 3 ? 'critical' : ''}">
                                <td>\${r.storeName}</td>
                                <td class="scheme-cell">\${r.scheme || '-'}</td>
                                <td class="ref-value">\${r.referenceValue || '-'}</td>
                                <td>\${r.sectionName}</td>
                                <td class="finding-title" title="\${r.title}">\${r.title.length > 60 ? r.title.substring(0, 60) + '...' : r.title}</td>
                                <td class="occurrence-count">
                                    <span class="occurrence-badge \${r.occurrenceCount >= 3 ? 'critical' : 'warning'}">\${r.occurrenceCount}x</span>
                                </td>
                                <td class="cycles-cell">\${formatConsecutiveCycles(r.cycles)}</td>
                                <td class="doc-links">
                                    \${r.documentNumbers.split(', ').map(doc => 
                                        \`<a href="/reports/\${doc}.html" target="_blank" class="doc-link">\${doc}</a>\`
                                    ).join(' ')}
                                </td>
                            </tr>
                        \`).join('') : '<tr><td colspan="8" class="no-data">No repetitive findings found - Good job! 🎉</td></tr>'}
                    </tbody>
                </table>
            \`;
            document.getElementById('repetitiveFindingsTable').innerHTML = repetitiveHtml;
        }

        // =============================================
        // BRANCH RANKINGS
        // =============================================
        
        function renderBranchRankings(rankings) {
            const container = document.getElementById('branchRankingsTable');
            
            if (!rankings || rankings.length === 0) {
                container.innerHTML = '<p class="no-data">No ranking data available</p>';
                return;
            }
            
            // Group rankings by scheme for better display
            const groupedByScheme = {};
            for (const r of rankings) {
                if (!groupedByScheme[r.scheme]) {
                    groupedByScheme[r.scheme] = [];
                }
                groupedByScheme[r.scheme].push(r);
            }
            
            let html = '<div class="rankings-grid">';
            
            for (const scheme of Object.keys(groupedByScheme).sort()) {
                const schemeRankings = groupedByScheme[scheme];
                
                html += \`
                    <div class="rankings-scheme-card">
                        <h4 class="scheme-title">\${scheme}</h4>
                        <table class="data-table rankings-table">
                            <thead>
                                <tr>
                                    <th>Cycle</th>
                                    <th>🥇 Highest Grade</th>
                                    <th>📉 Lowest Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                \`;
                
                // Sort by cycle name
                schemeRankings.sort((a, b) => a.cycle.localeCompare(b.cycle));
                
                for (const r of schemeRankings) {
                    const top3Html = r.top3.map((b, i) => 
                        \`<span class="rank-item top">\${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} \${b.storeName} <span class="rank-score">(\${b.avgScore}%)</span></span>\`
                    ).join('');
                    
                    // Show bottom 3 in descending order (highest to lowest)
                    const bottom3Html = [...r.bottom3].reverse().map((b, i) => 
                        \`<span class="rank-item bottom">\${b.storeName} <span class="rank-score">(\${b.avgScore}%)</span></span>\`
                    ).join('');
                    
                    html += \`
                        <tr>
                            <td class="cycle-cell">\${r.cycle}</td>
                            <td class="top-rank-cell">\${top3Html || '<span class="no-data">-</span>'}</td>
                            <td class="bottom-rank-cell">\${bottom3Html || '<span class="no-data">-</span>'}</td>
                        </tr>
                    \`;
                }
                
                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }
            
            html += '</div>';
            container.innerHTML = html;
        }

        // =============================================
        // STORE SCORES BAR CHART
        // =============================================
        
        let storeScoresChart = null;
        
        function renderStoreScoresChart(heatmapData, passingThreshold) {
            // Get selected years for title
            const yearCheckboxes = document.querySelectorAll('#yearOptions input[type="checkbox"]:checked');
            const selectedYears = Array.from(yearCheckboxes).map(cb => cb.value);
            
            let yearText = '';
            if (selectedYears.length === 1) {
                yearText = 'from January til December ' + selectedYears[0];
            } else if (selectedYears.length > 1) {
                yearText = 'for ' + selectedYears.join(', ');
            } else {
                yearText = '(All Years)';
            }
            
            // Update chart title
            document.getElementById('storeScoresChartTitle').textContent = 
                '📊 Average Food Safety Audits Per Store ' + yearText;
            
            if (!heatmapData || !heatmapData.stores || heatmapData.stores.length === 0) {
                return;
            }
            
            // Extract store scores from new heatmap data structure
            // Group by store name and calculate average across all schemes
            const storeMap = {};
            for (const item of heatmapData.stores) {
                if (!storeMap[item.storeName]) {
                    storeMap[item.storeName] = { total: 0, count: 0 };
                }
                storeMap[item.storeName].total += item.avgScore;
                storeMap[item.storeName].count += 1;
            }
            
            const storeScores = Object.entries(storeMap).map(([store, data]) => ({
                store,
                score: Math.round((data.total / data.count) * 10) / 10
            }));
            
            // Sort by score descending
            storeScores.sort((a, b) => b.score - a.score);
            
            const labels = storeScores.map(s => s.store);
            const scores = storeScores.map(s => s.score);
            const threshold = passingThreshold || 90;
            
            // Generate colors based on pass/fail
            const barColors = scores.map(score => 
                score >= threshold ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            );
            const borderColors = scores.map(score => 
                score >= threshold ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
            );
            
            // Destroy existing chart
            if (storeScoresChart) {
                storeScoresChart.destroy();
            }
            
            const ctx = document.getElementById('storeScoresChart').getContext('2d');
            
            storeScoresChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Average Score',
                            data: scores,
                            backgroundColor: barColors,
                            borderColor: borderColors,
                            borderWidth: 1,
                            borderRadius: 4,
                            barThickness: 'flex',
                            maxBarThickness: 50
                        },
                        {
                            label: 'Target (Food Safety Score ≥ ' + threshold + '%)',
                            data: Array(labels.length).fill(threshold),
                            type: 'line',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.type === 'line') {
                                        return 'Target: ' + context.raw + '%';
                                    }
                                    return context.dataset.label + ': ' + context.raw + '%';
                                }
                            }
                        },
                        datalabels: {
                            display: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 50,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Score (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Stores'
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'datalabels',
                    afterDatasetsDraw: function(chart) {
                        const ctx = chart.ctx;
                        chart.data.datasets.forEach((dataset, datasetIndex) => {
                            // Only show labels for bar chart, not line
                            if (dataset.type === 'line') return;
                            
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.data.forEach((bar, index) => {
                                const value = dataset.data[index];
                                ctx.fillStyle = '#1e293b';
                                ctx.font = 'bold 9px Arial';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(value + '%', bar.x, bar.y - 3);
                            });
                        });
                    }
                }]
            });
        }

        // =============================================
        // ACTION PLAN ANALYSIS
        // =============================================
        
        function renderActionPlanAnalysis(apAnalysis) {
            if (!apAnalysis) {
                document.getElementById('apSummaryStats').innerHTML = '<p class="no-data">No data available</p>';
                document.getElementById('ncByLocationTable').innerHTML = '<p class="no-data">No data available</p>';
                document.getElementById('openNCByLocationTable').innerHTML = '<p class="no-data">No data available</p>';
                return;
            }
            
            const { ncByLocation, openNCByLocation, summary } = apAnalysis;
            
            // Render Summary Stats
            const summaryHtml = \`
                <div class="nc-stat">
                    <span class="nc-stat-value">\${summary.totalFindings}</span>
                    <span class="nc-stat-label">Total Findings</span>
                </div>
                <div class="nc-stat closed">
                    <span class="nc-stat-value">\${summary.closedFindings}</span>
                    <span class="nc-stat-label">Closed</span>
                </div>
                <div class="nc-stat open">
                    <span class="nc-stat-value">\${summary.openFindings}</span>
                    <span class="nc-stat-label">Pending</span>
                </div>
                <div class="nc-stat">
                    <span class="nc-stat-value">\${summary.closureRate}%</span>
                    <span class="nc-stat-label">Closure Rate</span>
                </div>
            \`;
            document.getElementById('apSummaryStats').innerHTML = summaryHtml;
            
            // Render NC by Location Table
            const ncByLocationHtml = \`
                <table class="data-table ap-location-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Open</th>
                            <th>Closed</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${ncByLocation.length > 0 ? ncByLocation.map(r => \`
                            <tr>
                                <td>\${r.storeName}</td>
                                <td class="open-count \${r.open > 0 ? 'has-open' : ''}">\${r.open}</td>
                                <td class="closed-count">\${r.closed}</td>
                                <td class="total-count">\${r.total}</td>
                            </tr>
                        \`).join('') : '<tr><td colspan="4" class="no-data">No action plan data found</td></tr>'}
                    </tbody>
                    \${ncByLocation.length > 0 ? \`
                    <tfoot>
                        <tr class="totals-row">
                            <td><strong>Total</strong></td>
                            <td class="open-count has-open"><strong>\${summary.openFindings}</strong></td>
                            <td class="closed-count"><strong>\${summary.closedFindings}</strong></td>
                            <td class="total-count"><strong>\${summary.totalFindings}</strong></td>
                        </tr>
                    </tfoot>
                    \` : ''}
                </table>
            \`;
            document.getElementById('ncByLocationTable').innerHTML = ncByLocationHtml;
            
            // Render Open NC by Location Table (Store, Non-Conformity, Open, Days)
            const openNCHtml = \`
                <table class="data-table open-nc-table">
                    <thead>
                        <tr>
                            <th>Store</th>
                            <th>Non-Conformity</th>
                            <th>Open</th>
                            <th>Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${openNCByLocation.length > 0 ? openNCByLocation.map(r => {
                            // Create rows for each finding within the store
                            if (r.findings && r.findings.length > 0) {
                                return r.findings.map((f, idx) => \`
                                    <tr class="\${f.daysOpen > 30 ? 'overdue' : f.daysOpen > 14 ? 'warning' : ''}">
                                        <td class="store-cell">\${r.storeName}</td>
                                        <td class="finding-cell">
                                            <div class="finding-text">\${f.finding}</div>
                                            <div class="finding-meta">\${f.reference ? \`Ref: \${f.reference}\` : ''} \${f.documentNumber ? \`| \${f.documentNumber}\` : ''}</div>
                                        </td>
                                        <td class="open-count has-open">\${r.openCount}</td>
                                        <td class="days-open \${f.daysOpen > 30 ? 'critical' : f.daysOpen > 14 ? 'warning' : ''}">\${f.daysOpen}</td>
                                    </tr>
                                \`).join('');
                            } else {
                                return \`
                                    <tr class="\${r.maxDaysOpen > 30 ? 'overdue' : r.maxDaysOpen > 14 ? 'warning' : ''}">
                                        <td>\${r.storeName}</td>
                                        <td class="finding-cell">-</td>
                                        <td class="open-count has-open">\${r.openCount}</td>
                                        <td class="days-open \${r.maxDaysOpen > 30 ? 'critical' : r.maxDaysOpen > 14 ? 'warning' : ''}">\${r.maxDaysOpen}</td>
                                    </tr>
                                \`;
                            }
                        }).join('') : '<tr><td colspan="4" class="no-data">No open findings - All caught up! 🎉</td></tr>'}
                    </tbody>
                </table>
            \`;
            document.getElementById('openNCByLocationTable').innerHTML = openNCHtml;
        }

        // =============================================
        // CUSTOM QUERY BUILDER
        // =============================================
        
        let customQueryChart = null;
        let lastQueryResults = null;

        // Update query options based on subject
        function updateQueryOptions() {
            const subject = document.getElementById('querySubject').value;
            const metricSelect = document.getElementById('queryMetric');
            
            // Clear options
            metricSelect.innerHTML = '<option value="">-- Select metric --</option>';
            
            const options = {
                stores: [
                    { value: 'most_fails', text: 'Most Fails' },
                    { value: 'most_audits', text: 'Most Audits' },
                    { value: 'lowest_score', text: 'Lowest Average Score' },
                    { value: 'highest_score', text: 'Highest Average Score' },
                    { value: 'never_pass', text: 'Never Passed (0% pass rate)' },
                    { value: 'always_pass', text: 'Always Passed (100% pass rate)' },
                    { value: 'biggest_drop', text: 'Biggest Score Drop' },
                    { value: 'biggest_improvement', text: 'Biggest Improvement' }
                ],
                auditors: [
                    { value: 'most_audits', text: 'Most Audits Completed' },
                    { value: 'highest_score', text: 'Highest Average Score' },
                    { value: 'lowest_score', text: 'Lowest Average Score' },
                    { value: 'most_fails', text: 'Most Failed Audits' }
                ],
                sections: [
                    { value: 'lowest_score', text: 'Lowest Average Score' },
                    { value: 'highest_score', text: 'Highest Average Score' },
                    { value: 'most_fails', text: 'Highest Fail Rate' },
                    { value: 'most_repetitive', text: 'Most Repetitive Failures' }
                ],
                items: [
                    { value: 'most_repetitive', text: 'Most Repetitive Failures' },
                    { value: 'most_fails', text: 'Most Failed' },
                    { value: 'never_pass', text: 'Never Passed' },
                    { value: 'always_pass', text: 'Always Passed' },
                    { value: 'lowest_score', text: 'Lowest Average Score' }
                ]
            };
            
            if (options[subject]) {
                options[subject].forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    metricSelect.appendChild(option);
                });
            }
        }

        // Quick query shortcut
        function quickQuery(subject, metric) {
            document.getElementById('querySubject').value = subject;
            updateQueryOptions();
            document.getElementById('queryMetric').value = metric;
            runCustomQuery();
        }

        // Run custom query
        async function runCustomQuery() {
            const subject = document.getElementById('querySubject').value;
            const metric = document.getElementById('queryMetric').value;
            const limit = document.getElementById('queryLimit').value;
            
            if (!subject || !metric) {
                alert('Please select both a subject and metric');
                return;
            }
            
            showLoading(true);
            
            try {
                const filters = getFilters();
                const params = new URLSearchParams({
                    ...filters,
                    subject,
                    metric,
                    limit: limit === 'all' ? '1000' : limit
                });
                
                const response = await fetch('/api/admin/analytics/custom-query?' + params);
                if (!response.ok) throw new Error('Query failed');
                
                const data = await response.json();
                lastQueryResults = data;
                
                renderQueryResults(data, subject, metric);
                
            } catch (error) {
                console.error('Query error:', error);
                alert('Error running query: ' + error.message);
            } finally {
                showLoading(false);
            }
        }

        // Render query results
        function renderQueryResults(data, subject, metric) {
            const resultsSection = document.getElementById('queryResults');
            const titleEl = document.getElementById('queryResultsTitle');
            const chartContainer = document.getElementById('queryResultsChart');
            const tableContainer = document.getElementById('queryResultsTable');
            
            resultsSection.style.display = 'block';
            
            // Build title
            const subjectNames = { stores: 'Stores', auditors: 'Auditors', sections: 'Sections', items: 'Checklist Items' };
            const metricNames = {
                most_fails: 'Most Fails',
                most_audits: 'Most Audits',
                lowest_score: 'Lowest Score',
                highest_score: 'Highest Score',
                most_repetitive: 'Most Repetitive',
                never_pass: 'Never Passed',
                always_pass: 'Always Passed',
                biggest_drop: 'Biggest Drop',
                biggest_improvement: 'Biggest Improvement'
            };
            
            titleEl.textContent = \`\${subjectNames[subject]} - \${metricNames[metric]} (\${data.results.length} results)\`;
            
            // Render chart
            if (customQueryChart) customQueryChart.destroy();
            
            const ctx = document.getElementById('customQueryChart').getContext('2d');
            const labels = data.results.map(r => r.name.length > 30 ? r.name.substring(0, 30) + '...' : r.name);
            const values = data.results.map(r => r.value);
            
            const colors = values.map(v => {
                if (metric.includes('fail') || metric === 'lowest_score' || metric === 'never_pass' || metric === 'biggest_drop') {
                    return 'rgba(239, 68, 68, 0.7)'; // Red for bad things
                }
                return 'rgba(16, 185, 129, 0.7)'; // Green for good things
            });
            
            customQueryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: data.valueLabel || 'Value',
                        data: values,
                        backgroundColor: colors,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: data.results.length > 10 ? 'y' : 'x',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { beginAtZero: true },
                        y: { beginAtZero: true }
                    }
                }
            });
            
            // Render table
            let tableHtml = \`
                <table class="data-table query-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>\${subjectNames[subject]}</th>
                            <th>\${data.valueLabel || 'Value'}</th>
                            \${data.results[0]?.extra ? '<th>Details</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
            \`;
            
            data.results.forEach((r, i) => {
                const valueClass = (metric.includes('fail') || metric === 'lowest_score' || metric === 'never_pass') ? 'fail' : 
                                   (metric.includes('pass') || metric === 'highest_score' || metric === 'improvement') ? 'pass' : '';
                tableHtml += \`
                    <tr>
                        <td>\${i + 1}</td>
                        <td>\${r.name}</td>
                        <td class="\${valueClass}">\${typeof r.value === 'number' ? r.value.toFixed(1) : r.value}\${r.suffix || ''}</td>
                        \${r.extra ? \`<td>\${r.extra}</td>\` : ''}
                    </tr>
                \`;
            });
            
            tableHtml += '</tbody></table>';
            tableContainer.innerHTML = tableHtml;
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Export query results
        function exportQueryResults() {
            if (!lastQueryResults) return;
            
            let csv = 'Name,Value,Details\\n';
            lastQueryResults.results.forEach(r => {
                csv += \`"\${r.name}",\${r.value},"\${r.extra || ''}"\\n\`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analytics-query-results.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        // ===========================================
        // EXPORT FUNCTIONS - Charts, Tables, All Data
        // ===========================================

        // Export a chart as PNG image with white background
        function exportSectionChart(chartId, filename) {
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                alert('Chart not found');
                return;
            }
            
            // Create a temporary canvas with white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the chart on top
            ctx.drawImage(canvas, 0, 0);
            
            // Create a link and trigger download
            const link = document.createElement('a');
            link.download = \`\${filename}_\${new Date().toISOString().slice(0,10)}.png\`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        }

        // Export a section's table(s) to Excel
        function exportSectionTable(sectionId, filename) {
            const section = document.getElementById(sectionId);
            if (!section) {
                alert('Section not found');
                return;
            }
            
            const tables = section.querySelectorAll('table');
            if (tables.length === 0) {
                alert('No tables found in this section');
                return;
            }
            
            try {
                const wb = XLSX.utils.book_new();
                
                tables.forEach((table, index) => {
                    // Get the table heading/title
                    let sheetName = \`Sheet\${index + 1}\`;
                    const prevH3 = table.closest('.data-table-container, .nc-section, .branches-table-container')?.querySelector('h3');
                    if (prevH3) {
                        sheetName = prevH3.textContent.replace(/[\\[\\]\\*\\?\\/\\\\:]/g, '').substring(0, 31);
                    } else if (index === 0) {
                        sheetName = filename.replace(/_/g, ' ').substring(0, 31);
                    }
                    
                    const ws = XLSX.utils.table_to_sheet(table);
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                });
                
                XLSX.writeFile(wb, \`\${filename}_\${new Date().toISOString().slice(0,10)}.xlsx\`);
            } catch (err) {
                console.error('Export error:', err);
                alert('Error exporting to Excel: ' + err.message);
            }
        }

        // Export Store Scores chart data to Excel
        function exportStoreScoresTable() {
            if (!analyticsData || !analyticsData.storeScores) {
                alert('No store scores data available');
                return;
            }
            
            const data = analyticsData.storeScores.map(s => ({
                'Store': s.StoreName,
                'Average Score (%)': s.AvgScore?.toFixed(1) || 'N/A',
                'Audit Count': s.AuditCount || 0
            }));
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Store Scores');
            XLSX.writeFile(wb, \`Store_Scores_\${new Date().toISOString().slice(0,10)}.xlsx\`);
        }

        // Download ALL analytics as a ZIP file
        async function downloadAllAnalytics() {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'export-status-overlay';
            statusDiv.innerHTML = '<div class="export-status-box"><p>Preparing analytics export...</p><div class="export-progress"></div></div>';
            document.body.appendChild(statusDiv);
            
            try {
                const zip = new JSZip();
                const dateStr = new Date().toISOString().slice(0,10);
                
                // 1. Export Summary Cards
                updateExportStatus(statusDiv, 'Exporting summary data...');
                const summaryData = [
                    { Metric: 'Total Audits', Value: document.getElementById('totalAudits')?.textContent || 'N/A' },
                    { Metric: 'Number of Selected Stores', Value: document.getElementById('totalStores')?.textContent || 'N/A' },
                    { Metric: 'Average Score', Value: document.getElementById('avgScore')?.textContent || 'N/A' },
                    { Metric: 'Pass Rate', Value: document.getElementById('passRate')?.textContent || 'N/A' },
                    { Metric: 'Fail Rate', Value: document.getElementById('failRate')?.textContent || 'N/A' },
                    { Metric: 'Action Plans Submitted', Value: document.getElementById('actionPlansSubmitted')?.textContent || 'N/A' },
                    { Metric: 'Findings Solved', Value: document.getElementById('actionPlanCompletion')?.textContent || 'N/A' }
                ];
                const summaryWb = XLSX.utils.book_new();
                const summaryWs = XLSX.utils.json_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(summaryWb, summaryWs, 'Summary');
                zip.file(\`Summary_\${dateStr}.xlsx\`, XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' }));

                // 2. Export Charts as PNG with white background
                updateExportStatus(statusDiv, 'Exporting charts...');
                const charts = [
                    { id: 'trendChart', name: 'Score_Trends' },
                    { id: 'categoryChart', name: 'Category_Analysis' },
                    { id: 'sectionChart', name: 'Section_Analysis' },
                    { id: 'storeScoresChart', name: 'Store_Scores' }
                ];
                
                for (const chart of charts) {
                    const canvas = document.getElementById(chart.id);
                    if (canvas) {
                        // Create temp canvas with white background
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const ctx = tempCanvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                        ctx.drawImage(canvas, 0, 0);
                        
                        const dataUrl = tempCanvas.toDataURL('image/png');
                        const base64Data = dataUrl.split(',')[1];
                        zip.file(\`Charts/\${chart.name}_\${dateStr}.png\`, base64Data, { base64: true });
                    }
                }

                // 3. Export all tables
                updateExportStatus(statusDiv, 'Exporting tables...');
                const sections = [
                    { id: 'scoreTrendsSection', name: 'Score_Trends' },
                    { id: 'categoryAnalysisSection', name: 'Category_Analysis' },
                    { id: 'sectionAnalysisSection', name: 'Section_Analysis' },
                    { id: 'storePerformanceSection', name: 'Store_Performance' },
                    { id: 'actionPlanSection', name: 'Action_Plan_Analysis' },
                    { id: 'ncAnalysisSection', name: 'NC_Analysis' },
                    { id: 'branchRankingsSection', name: 'Branch_Rankings' }
                ];
                
                for (const sec of sections) {
                    const section = document.getElementById(sec.id);
                    if (section) {
                        const tables = section.querySelectorAll('table');
                        if (tables.length > 0) {
                            const wb = XLSX.utils.book_new();
                            tables.forEach((table, index) => {
                                let sheetName = \`Sheet\${index + 1}\`;
                                const prevH3 = table.closest('.data-table-container, .nc-section, .branches-table-container')?.querySelector('h3');
                                if (prevH3) {
                                    sheetName = prevH3.textContent.replace(/[\\[\\]\\*\\?\\/\\\\:]/g, '').substring(0, 31);
                                }
                                const ws = XLSX.utils.table_to_sheet(table);
                                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                            });
                            zip.file(\`Tables/\${sec.name}_\${dateStr}.xlsx\`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
                        }
                    }
                }

                // 4. Export store scores data
                if (analyticsData && analyticsData.storeScores) {
                    const storeData = analyticsData.storeScores.map(s => ({
                        'Store': s.StoreName,
                        'Average Score (%)': s.AvgScore?.toFixed(1) || 'N/A',
                        'Audit Count': s.AuditCount || 0
                    }));
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(storeData);
                    XLSX.utils.book_append_sheet(wb, ws, 'Store Scores');
                    zip.file(\`Tables/Store_Scores_\${dateStr}.xlsx\`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
                }

                // Generate and download ZIP
                updateExportStatus(statusDiv, 'Creating ZIP file...');
                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, \`Analytics_Export_\${dateStr}.zip\`);
                
                statusDiv.remove();
            } catch (err) {
                console.error('Download all error:', err);
                statusDiv.innerHTML = '<div class="export-status-box error"><p>Error: ' + err.message + '</p><button onclick="this.parentElement.parentElement.remove()">Close</button></div>';
            }
        }

        function updateExportStatus(div, message) {
            const p = div.querySelector('p');
            if (p) p.textContent = message;
        }
    </script>
</body>
</html>
        `;

        res.send(html);
    }
}

module.exports = AnalyticsPage;
