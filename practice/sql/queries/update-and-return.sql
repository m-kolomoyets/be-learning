SELECT * from sales.products;

UPDATE sales.products
SET price = ROUND(price * 1.2, 2)
WHERE category = 'Car'
RETURNING productid, product, category, price;
