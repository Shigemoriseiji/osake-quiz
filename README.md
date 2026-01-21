# osake-quiz
git clone https://github.com/Shigemoriseiji/osake-quiz.git  
cd osake-quiz  
docker compose up -d --build  
docker compose exec mysql mysql -uroot -prootpass -e "DROP DATABASE IF EXISTS osake_quiz;"  
docker compose exec mysql bash  
mysql --default-character-set=utf8mb4 -uroot -prootpass < /root/sql/initialize.sql  
  
URL：http://localhost:8080/  
