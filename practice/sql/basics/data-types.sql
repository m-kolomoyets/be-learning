DROP TABLE IF EXISTS basics.data_types;

CREATE TABLE basics.data_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    age INTEGER DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    price NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO basics.data_types (name, description, price, metadata)
VALUES
    ('Mykola', 'Hello world', 10.2, '{"browser": "Chrome"}'),
    ('Denys', 'Hello world', 10.2, '{"browser": "Chrome"}'),
    ('Mikluha', 'Hello world', 10.2, '{"hello": "world"}');

SELECT
	name,
	metadata ->> 'browser' as browser
FROM basics.data_types
WHERE metadata ? 'browser';
