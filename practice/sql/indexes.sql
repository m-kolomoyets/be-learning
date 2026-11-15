-- idx - index
-- posts - table name
-- status - column name
CREATE INDEX IF NOT EXISTS idx_posts_status
    ON posts(status);

SELECT
	title,
	status,
	views
FROM posts
WHERE status = 'published'
ORDER by views DESC;

-- idx - index
-- posts - table name
-- status - column name
-- views - other column name
CREATE INDEX IF NOT EXISTS idx_posts_status_views
    ON posts(status, views DESC);

SELECT
	title,
	status,
	views
FROM posts
WHERE user_id = (
	SELECT id
	FROM users
	WHERE name = 'Mykola'
)
ORDER by views DESC;

CREATE INDEX IF NOT EXISTS idx_users_name
    ON users(name);

CREATE INDEX IF NOT EXISTS idx_posts_user_id
    ON posts(user_id);

    EXPLAIN ANALYZE
    SELECT title, status, views
    FROM posts
    WHERE status = 'published'
    ORDER BY views DESC;
