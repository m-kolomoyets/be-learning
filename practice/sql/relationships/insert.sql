TRUNCATE TABLE users, posts, comments, post_tags, tags;

--

INSERT INTO users (name)
VALUES
    ('Mykola'),
    ('Denys');

--

INSERT INTO posts (user_id, title, status, views)
SELECT id, 'Article 1', 'published', 100
FROM users
WHERE name = 'Mykola';

INSERT INTO posts (user_id, title, status, views)
SELECT id, 'Article 2', 'draft', 40
FROM users
WHERE name = 'Mykola';

INSERT INTO posts (user_id, title, status, views)
SELECT id, 'Article 3', 'published', 180
FROM users
WHERE name = 'Denys';

INSERT INTO posts (user_id, title, status, views)
SELECT id, 'Article 4', 'draft', 50
FROM users
WHERE name = 'Denys';

--

INSERT INTO comments (post_id, body)
SELECT id, 'Comment 1'
FROM posts
WHERE status = 'draft';

INSERT INTO comments (post_id, body)
SELECT id, 'Comment 2'
FROM posts
WHERE status = 'published';

--

INSERT INTO tags (name)
VALUES
	('frontend'),
	('backend');

--

INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.status = 'draft' AND t.name = 'frontend';

INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t
WHERE p.status = 'published' AND t.name = 'backend';

--

SELECT 'Database seeded with basic users, posts, comments, tags' AS message;
