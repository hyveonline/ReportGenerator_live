-- ===========================================================================
-- UPDATE SESSION CLEANUP STORED PROCEDURE - LIVE DATABASE
-- Run this on FoodSafetyDB_Live to fix the system sender session issue
-- ===========================================================================

USE FoodSafetyDB_Live;
GO

-- Update the stored procedure to NOT delete sessions with refresh tokens
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CleanupExpiredSessions')
BEGIN
    DROP PROCEDURE sp_CleanupExpiredSessions;
END
GO

CREATE PROCEDURE sp_CleanupExpiredSessions
AS
BEGIN
    -- Only delete expired sessions that do NOT have a refresh token
    -- Sessions with refresh tokens (like system sender - appnotification@gmrlapps.com) 
    -- are preserved for automatic token refresh
    DELETE FROM Sessions 
    WHERE expires_at < GETDATE() 
    AND (azure_refresh_token IS NULL OR azure_refresh_token = '');
    
    PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' expired sessions cleaned up (preserved sessions with refresh tokens)';
END
GO

PRINT '✅ Updated sp_CleanupExpiredSessions to preserve system sender sessions';
GO

-- ===========================================================================
-- VERIFY CURRENT SYSTEM SENDER SESSION STATUS
-- ===========================================================================
SELECT 
    u.email,
    u.display_name,
    s.session_token,
    s.created_at,
    s.expires_at,
    CASE WHEN s.expires_at > GETDATE() THEN 'Active' ELSE 'Expired' END AS Status,
    CASE WHEN s.azure_refresh_token IS NOT NULL THEN 'Yes' ELSE 'No' END AS HasRefreshToken,
    DATEDIFF(HOUR, GETDATE(), s.expires_at) AS HoursUntilExpiry
FROM Sessions s
INNER JOIN Users u ON s.user_id = u.id
WHERE u.email = 'appnotification@gmrlapps.com'
ORDER BY s.created_at DESC;
GO

PRINT '✅ Script completed successfully';
GO
