SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

IF COL_LENGTH('dbo.Orders', 'TrafficSource') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD TrafficSource NVARCHAR(20) NULL;
END;

EXEC(N'
    UPDATE dbo.Orders
    SET TrafficSource = CASE OrderType
        WHEN ''DineIn'' THEN ''DineIn''
        WHEN ''TakeAway'' THEN ''TakeAway''
        WHEN ''Delivery'' THEN ''Delivery''
        ELSE ''Other''
    END
    WHERE TrafficSource IS NULL
       OR TrafficSource NOT IN (''DineIn'',''TakeAway'',''Delivery'',''Phone'',''Referral'',''SocialMedia'',''Other'');
');

EXEC(N'ALTER TABLE dbo.Orders ALTER COLUMN TrafficSource NVARCHAR(20) NOT NULL;');

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.Orders') AND c.name = 'TrafficSource'
)
BEGIN
    EXEC(N'ALTER TABLE dbo.Orders ADD CONSTRAINT DF_Orders_TrafficSource DEFAULT ''Other'' FOR TrafficSource;');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.Orders') AND name = 'CK_Orders_TrafficSource'
)
BEGIN
    EXEC(N'ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_TrafficSource CHECK (TrafficSource IN (''DineIn'',''TakeAway'',''Delivery'',''Phone'',''Referral'',''SocialMedia'',''Other''));');
END;
