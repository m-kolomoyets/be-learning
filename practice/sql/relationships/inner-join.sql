-- One to many

SELECT
    u.name as author_name,
    p.title as post_title,
    p.status as post_status,
    p.views as post_views
FROM  users u
INNER JOIN posts p
    ON p.user_id = u.id
WHERE p.status = 'draft'
ORDER BY post_views DESC;

-- Many to Many

SELECT
	p.title as post_title,
	t.name as tag_name
FROM posts p
INNER JOIN post_tags pt
    ON p.id = pt.post_id
INNER JOIN tags t
    ON t.id = pt.tag_id
ORDER BY post_title;

--

SELECT
	p.title as post_title,
	p.status,
	p.views,
	u.name as author_name,
	c.body as comment_body
FROM posts p
INNER JOIN users u
	ON u.id = p.user_id
LEFT JOIN comments c
	ON c.post_id = p.id
ORDER BY p.views DESC;
