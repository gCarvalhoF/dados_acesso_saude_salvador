BACKEND_CONTAINER = dados_acesso_saude_salvador-web-1
DATABASE_CONTAINER = dados_acesso_saude_salvador-db-1
REDIS_CONTAINER = dados_acesso_saude_salvador-redis-1

bash:
	docker exec -it $(BACKEND_CONTAINER) bash

debug:
	docker attach $(BACKEND_CONTAINER)

console:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails c

routes:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails routes

migrate:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails db:migrate

rollback:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails db:rollback

seed:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails db:seed

drop:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails db:drop

create_db:
	docker exec -it $(BACKEND_CONTAINER) bundle exec rails db:create