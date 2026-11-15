BEGIN;

UPDATE posts
SET status = 'published'
WHERE title = 'Article 2'
	AND status = 'draft';

UPDATE posts
SET views = views + 50
WHERE title = 'Article 2';

COMMIT;

SELECT
	title,
	status,
	views
FROM posts
WHERE title = 'Article 2';
