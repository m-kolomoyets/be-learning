SELECT * from sales.customers;

UPDATE sales.customers
SET
	lastname = 'Smith'
WHERE lastname IS NULL;

SELECT * from sales.customers;

--

SELECT * from sales.products;

UPDATE sales.products
SET
	price = ROUND(price * 1.10, 2)
WHERE
	product ILIKE '%tire%' OR category = 'Clothing';

SELECT * from sales.products;
