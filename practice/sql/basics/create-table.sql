-- students
DROP TABLE IF EXISTS basics.students;

CREATE TABLE basics.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 18),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO basics.students (name, email, age)
VALUES
    ('Mykola', 'aaa@aaa.com', 19),
    ('John', 'bbb@bbb.com', 23);
