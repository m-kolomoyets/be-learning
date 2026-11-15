SELECT
	u.name AS author_name,
	COUNT(p.id) AS total_posts_count,
	COUNT(p.id) FILTER (WHERE p.status = 'published') AS published_posts,
	SUM(p.views) AS total_post_views,
	SUM(p.views) FILTER (WHERE p.status = 'published') AS total_publihed_post_views
FROM posts p
INNER JOIN users u
	ON p.user_id = u.id
GROUP BY author_name
ORDER BY total_post_views DESC;

SELECT
	t.name as tag_name,
	COUNT(DISTINCT p.id) as total_unique_posts
FROM tags t
LEFT JOIN post_tags pt
	ON pt.tag_id = t.id
LEFT JOIN posts p
	ON pt.post_id = p.id
GROUP BY t.id, tag_name
ORDER BY total_unique_posts DESC;
