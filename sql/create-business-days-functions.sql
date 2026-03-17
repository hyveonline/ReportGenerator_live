-- =============================================
-- Business Days Functions for Escalation System
-- Counts only Monday-Friday (excludes Saturday & Sunday)
-- =============================================

USE FoodSafetyDB_Live;
GO

-- =============================================
-- Function: dbo.fn_AddBusinessDays
-- Adds N business days to a given date
-- Skips Saturdays (7) and Sundays (1)
-- =============================================
IF OBJECT_ID('dbo.fn_AddBusinessDays', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_AddBusinessDays;
GO

CREATE FUNCTION dbo.fn_AddBusinessDays
(
    @StartDate DATETIME,
    @BusinessDays INT
)
RETURNS DATETIME
AS
BEGIN
    DECLARE @ResultDate DATETIME = @StartDate;
    DECLARE @DaysAdded INT = 0;
    DECLARE @Direction INT = CASE WHEN @BusinessDays >= 0 THEN 1 ELSE -1 END;
    DECLARE @AbsDays INT = ABS(@BusinessDays);
    
    WHILE @DaysAdded < @AbsDays
    BEGIN
        SET @ResultDate = DATEADD(DAY, @Direction, @ResultDate);
        
        -- Check if it's a weekday (Monday=2 through Friday=6)
        IF DATEPART(WEEKDAY, @ResultDate) NOT IN (1, 7) -- Not Sunday(1) or Saturday(7)
        BEGIN
            SET @DaysAdded = @DaysAdded + 1;
        END
    END
    
    RETURN @ResultDate;
END
GO

-- =============================================
-- Function: dbo.fn_GetBusinessDaysDiff
-- Calculates business days between two dates
-- Returns positive if EndDate > StartDate
-- Returns negative if EndDate < StartDate
-- =============================================
IF OBJECT_ID('dbo.fn_GetBusinessDaysDiff', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_GetBusinessDaysDiff;
GO

CREATE FUNCTION dbo.fn_GetBusinessDaysDiff
(
    @StartDate DATETIME,
    @EndDate DATETIME
)
RETURNS INT
AS
BEGIN
    DECLARE @BusinessDays INT = 0;
    DECLARE @CurrentDate DATETIME;
    DECLARE @Direction INT;
    
    IF @EndDate >= @StartDate
    BEGIN
        SET @CurrentDate = @StartDate;
        SET @Direction = 1;
        
        WHILE @CurrentDate < @EndDate
        BEGIN
            SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
            
            -- Count only weekdays
            IF DATEPART(WEEKDAY, @CurrentDate) NOT IN (1, 7)
            BEGIN
                SET @BusinessDays = @BusinessDays + 1;
            END
        END
    END
    ELSE
    BEGIN
        -- EndDate is before StartDate, return negative
        SET @CurrentDate = @EndDate;
        
        WHILE @CurrentDate < @StartDate
        BEGIN
            SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
            
            IF DATEPART(WEEKDAY, @CurrentDate) NOT IN (1, 7)
            BEGIN
                SET @BusinessDays = @BusinessDays - 1;
            END
        END
    END
    
    RETURN @BusinessDays;
END
GO

-- =============================================
-- Test the functions
-- =============================================
PRINT 'Testing fn_AddBusinessDays:';
PRINT 'Add 7 business days to Monday 2026-03-16: ' + CONVERT(VARCHAR, dbo.fn_AddBusinessDays('2026-03-16', 7), 120);
PRINT 'Add 7 business days to Friday 2026-03-20: ' + CONVERT(VARCHAR, dbo.fn_AddBusinessDays('2026-03-20', 7), 120);

PRINT '';
PRINT 'Testing fn_GetBusinessDaysDiff:';
PRINT 'Business days from 2026-03-16 to 2026-03-23 (Mon to Mon): ' + CAST(dbo.fn_GetBusinessDaysDiff('2026-03-16', '2026-03-23') AS VARCHAR);
PRINT 'Business days from 2026-03-16 to 2026-03-20 (Mon to Fri): ' + CAST(dbo.fn_GetBusinessDaysDiff('2026-03-16', '2026-03-20') AS VARCHAR);

PRINT '';
PRINT 'Business days functions created successfully!';
GO
