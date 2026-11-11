SELECT * from sales.ordersarchive;

DELETE FROM sales.ordersarchive
WHERE creationtime <= '2024-04-02';

SELECT * from sales.ordersarchive;
