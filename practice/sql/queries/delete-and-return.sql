SELECT * from sales.products;

DELETE FROM sales.products
WHERE category = 'Car'
RETURNING productid, product, category, price;
