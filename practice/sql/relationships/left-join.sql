SELECT
	p.title as post_title,
	c.body as comment_title
FROM posts p
LEFT JOIN comments c
ON c.post_id = p.id
ORDER BY p.title;
