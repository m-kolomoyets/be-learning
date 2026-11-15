SELECT
	p.title,
	p.status,
	p.views
FROM posts p
WHERE views > (
	SELECT AVG(p_sub.views) FROM posts p_sub
)
ORDER BY p.views DESC;
