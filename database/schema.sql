/* =====================================================================
   Chili POS  -  SQL Server 2019 schema + seed data
   Run in SQL Server Management Studio (SSMS) as a whole script (F5).
   ===================================================================== */
IF DB_ID('ChiliPOS') IS NULL CREATE DATABASE ChiliPOS;
GO
USE ChiliPOS;
GO

/* ---------- Drop (dev re-run) ---------- */
IF OBJECT_ID('dbo.OrderItems')   IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders')       IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Reservations') IS NOT NULL DROP TABLE dbo.Reservations;
IF OBJECT_ID('dbo.Products')     IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Categories')   IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.DiningTables') IS NOT NULL DROP TABLE dbo.DiningTables;
IF OBJECT_ID('dbo.Settings')     IS NOT NULL DROP TABLE dbo.Settings;
IF OBJECT_ID('dbo.Users')        IS NOT NULL DROP TABLE dbo.Users;
GO

/* ---------- Tables ---------- */
CREATE TABLE dbo.Users (
    UserId       INT IDENTITY(1,1) PRIMARY KEY,
    FullName     NVARCHAR(100) NOT NULL,
    Username     NVARCHAR(50)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(200) NOT NULL,
    Role         NVARCHAR(20)  NOT NULL DEFAULT 'Cashier'
                 CHECK (Role IN ('Admin','Cashier','Waiter')),
    IsActive     BIT NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.Settings (
    SettingKey   NVARCHAR(50)  PRIMARY KEY,
    SettingValue NVARCHAR(255) NOT NULL
);

CREATE TABLE dbo.DiningTables (
    TableId   INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(30) NOT NULL UNIQUE,
    Seats     INT NOT NULL DEFAULT 4,
    Status    NVARCHAR(20) NOT NULL DEFAULT 'Available'
              CHECK (Status IN ('Available','Occupied','Reserved'))
);

CREATE TABLE dbo.Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    Name       NVARCHAR(60) NOT NULL UNIQUE,
    Emoji      NVARCHAR(8)  NULL,
    SortOrder  INT NOT NULL DEFAULT 0
);

CREATE TABLE dbo.Products (
    ProductId   INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId  INT NOT NULL REFERENCES dbo.Categories(CategoryId),
    Name        NVARCHAR(150) NOT NULL,
    Price       DECIMAL(10,2) NOT NULL CHECK (Price >= 0),
    IsVeg       BIT NOT NULL DEFAULT 1,
    DiscountPct INT NOT NULL DEFAULT 0 CHECK (DiscountPct BETWEEN 0 AND 100),
    Emoji       NVARCHAR(8)  NULL,
    ImageUrl    NVARCHAR(500) NULL,
    IsActive    BIT NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE INDEX IX_Products_Category ON dbo.Products(CategoryId) WHERE IsActive = 1;

CREATE TABLE dbo.Orders (
    OrderId         INT IDENTITY(1,1) PRIMARY KEY,
    OrderNo         AS ('ORD-' + RIGHT('000000' + CAST(OrderId AS VARCHAR(10)), 6)) PERSISTED,
    TableId         INT NULL REFERENCES dbo.DiningTables(TableId),
    OrderType       NVARCHAR(20) NOT NULL DEFAULT 'DineIn'
                    CHECK (OrderType IN ('DineIn','TakeAway','Delivery')),
    TrafficSource   NVARCHAR(20) NOT NULL CONSTRAINT DF_Orders_TrafficSource DEFAULT 'Other'
                    CONSTRAINT CK_Orders_TrafficSource CHECK (TrafficSource IN ('DineIn','TakeAway','Delivery','Phone','Referral','SocialMedia','Other')),
    Status          NVARCHAR(20) NOT NULL DEFAULT 'InKitchen'
                    CHECK (Status IN ('InKitchen','Served','Paid','Cancelled')),
    CustomerName    NVARCHAR(100) NULL,
    CustomerPhone   NVARCHAR(30)  NULL,
    DeliveryAddress NVARCHAR(300) NULL,
    SubTotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
    TaxRate         DECIMAL(5,2)  NOT NULL DEFAULT 0,
    TaxAmount       DECIMAL(10,2) NOT NULL DEFAULT 0,
    Total           DECIMAL(10,2) NOT NULL DEFAULT 0,
    PaymentMethod   NVARCHAR(20)  NULL CHECK (PaymentMethod IN ('Cash','Card','QR')),
    CreatedBy       INT NULL REFERENCES dbo.Users(UserId),
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    PaidAt          DATETIME2 NULL
);
CREATE INDEX IX_Orders_Status  ON dbo.Orders(Status, CreatedAt DESC);
CREATE INDEX IX_Orders_PaidAt  ON dbo.Orders(PaidAt) WHERE Status = 'Paid';

CREATE TABLE dbo.OrderItems (
    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId     INT NOT NULL REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
    ProductId   INT NOT NULL REFERENCES dbo.Products(ProductId),
    ProductName NVARCHAR(150) NOT NULL,
    UnitPrice   DECIMAL(10,2) NOT NULL,
    Quantity    INT NOT NULL CHECK (Quantity > 0),
    Note        NVARCHAR(255) NULL
);
CREATE INDEX IX_OrderItems_Order ON dbo.OrderItems(OrderId);

CREATE TABLE dbo.Reservations (
    ReservationId INT IDENTITY(1,1) PRIMARY KEY,
    TableId       INT NOT NULL REFERENCES dbo.DiningTables(TableId),
    CustomerName  NVARCHAR(100) NOT NULL,
    Phone         NVARCHAR(30) NULL,
    Guests        INT NOT NULL DEFAULT 2,
    ReservedFor   DATETIME2 NOT NULL,
    Status        NVARCHAR(20) NOT NULL DEFAULT 'Booked'
                  CHECK (Status IN ('Booked','Seated','Cancelled','NoShow')),
    Notes         NVARCHAR(255) NULL,
    CreatedAt     DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

/* ---------- Seed data ---------- */
INSERT INTO dbo.Settings (SettingKey, SettingValue) VALUES
 ('RestaurantName','Chili POS'), ('TaxRate','5'), ('Currency','$');

INSERT INTO dbo.DiningTables (TableName, Seats) VALUES
 ('Table 1',2),('Table 2',2),('Table 3',4),('Table 4',4),('Table 5',4),
 ('Table 6',6),('Table 7',6),('Table 8',8),('Table 9',4),('Table 10',10);

INSERT INTO dbo.Categories (Name, Emoji, SortOrder) VALUES
 ('Breakfast',N'🍳',1),('Soups',N'🍜',2),('Pasta',N'🍝',3),
 ('Main Course',N'🍛',4),('Burgers',N'🍔',5),('Drinks',N'🍹',6),('Desserts',N'🍰',7);

INSERT INTO dbo.Products (CategoryId, Name, Price, IsVeg, DiscountPct, Emoji) VALUES
 (1, N'Tasty Vegetable Salad Healthy Diet',        17.99, 1, 20, N'🥗'),
 (1, N'Avocado Toast With Poached Egg',            11.50, 1, 0,  N'🥑'),
 (1, N'Pancakes With Maple Syrup',                  9.90, 1, 0,  N'🥞'),
 (2, N'Creamy Tomato Basil Soup',                   7.50, 1, 0,  N'🍅'),
 (2, N'Chicken Noodle Soup',                        8.90, 0, 0,  N'🍜'),
 (3, N'Spaghetti Carbonara',                       13.99, 0, 0,  N'🍝'),
 (3, N'Penne Arrabbiata',                          12.50, 1, 0,  N'🌶️'),
 (4, N'Tacos Salsa With Chickens Grilled',         14.99, 0, 0,  N'🌮'),
 (4, N'Meat Sushi Maki With Tuna, Shirp And Other',  9.99, 0, 0,  N'🍣'),
 (4, N'Grilled Salmon With Vegetables',            21.90, 0, 0,  N'🐟'),
 (5, N'Original Chess Meat Burger With Chips',     23.99, 0, 0,  N'🍔'),
 (5, N'Original Chess Burger With French Fries',   10.59, 0, 20, N'🍟'),
 (5, N'Crispy Veggie Burger',                       9.80, 1, 0,  N'🥬'),
 (6, N'Fresh Orange Juice With Basil Seed No Sugar',12.99, 1, 0,  N'🍊'),
 (6, N'Iced Lemon Tea',                             3.90, 1, 0,  N'🍋'),
 (6, N'Cappuccino',                                 4.50, 1, 0,  N'☕'),
 (7, N'Chocolate Lava Cake',                        6.90, 1, 0,  N'🍫'),
 (7, N'Strawberry Cheesecake',                      7.20, 1, 0,  N'🍓');
GO
/* Default login users (admin / floyd / arlene) are created automatically
   by the Node.js server on first start, with bcrypt-hashed passwords. */
