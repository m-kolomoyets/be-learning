docker run -d \
  --name pg-learning \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=MyDatabase \
  -p 5432:5432 \
  -v pg-learning-data:/var/lib/postgresql/data \
  postgres:17
