SELECT * from sales.products;

DELETE FROM sales.products
WHERE category = 'Car';

INSERT INTO sales.products (productid, product, category, price)
VALUES
	(30, 'BMW E30', 'Car', 3000),
	(190, 'Mercedes 190', 'Car', 3000)
RETURNING productid, product, category, price;
