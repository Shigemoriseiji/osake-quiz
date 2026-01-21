-- 文字コードを明示（投入時の文字化け対策）
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ユーザー作成
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'apppass';
GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';
FLUSH PRIVILEGES;

-- DB作成 & 選択（ここが最重要）
CREATE DATABASE IF NOT EXISTS osake_quiz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE osake_quiz;

-- 再実行対策（DB名を付けて安全化）
DROP TABLE IF EXISTS osake_quiz.result_items;
DROP TABLE IF EXISTS osake_quiz.results;
DROP TABLE IF EXISTS osake_quiz.questions;

-- テーブル
CREATE TABLE osake_quiz.questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  prompt VARCHAR(255) NOT NULL,
  option_a VARCHAR(100) NOT NULL,
  option_b VARCHAR(100) NOT NULL,
  option_c VARCHAR(100) NOT NULL,
  option_d VARCHAR(100) NOT NULL,
  answer CHAR(1) NOT NULL,
  explanation VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE osake_quiz.results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total INT NOT NULL,
  correct INT NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE osake_quiz.result_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT NOT NULL,
  question_id INT NOT NULL,
  selected CHAR(1) NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  FOREIGN KEY (result_id) REFERENCES osake_quiz.results(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES osake_quiz.questions(id) ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- =========================
-- 初期データ（10問）
-- =========================
INSERT INTO questions
(category, prompt, option_a, option_b, option_c, option_d, answer, explanation)
VALUES
('日本酒', '日本酒は大きく分けて何種類あるか', '3', '8', '11', '15', 'B', '精米歩合や醸造アルコールの添加有無'),
('日本酒', '熱燗とは何度付近の日本酒のことか', '90度', '70度', '50度', '30度', 'C', '40度はぬる燗、45度は上燗と呼ぶ'),
('日本酒', '10度に冷やした日本酒の呼び名はどれか', '月冷え', '涼冷え', '花冷え', '雪冷え', 'C', '15度が涼冷え、5度が雪冷え'),
('ビール', '日本で初めてビールが作られたのはいつ頃か', '安土桃山時代', '江戸時代', '明治時代', '昭和時代', 'B', '江戸時代の1812年'),
('蒸留酒', 'メキシコのグサーノ・ホロに漬け込んである生物はなにか', 'カエル', 'タランチュラ', 'ハブ', 'イモムシ', 'D', 'メスカルというお酒に赤いイモムシを漬け込む'),
('ビール', 'ビール瓶の王冠のギザギザの数として正しいものはどれか', '15', '18', '21', '24', 'C', 'アメリカやドイツでも共通'),
('用語', '3Mとはどの種類のお酒を指す言葉か', 'ワイン', 'ウイスキー', 'テキーラ', '焼酎', 'D', 'プレミアム焼酎「魔王」「村尾」「森伊蔵」を指す'),
('ウイスキー', '日本初の本格的蒸留所はどこか', '大阪', '京都', '宮城', '山梨', 'A', '大阪の山崎蒸留所'),
('ウイスキー', 'シングルモルトウイスキーの定義で正しいものはどれか', '1つの蒸留所で造る', '単一蒸留年の原酒のみ使う', '原料1種類で造る', '大麦以外の穀物を使わない', 'A', 'モルトウイスキーで使う穀物は元から1種類'),
('蒸留酒', '世界で一番度数が高いスピリタスの度数はどれか', '92度', '94度', '96度', '98度', 'C', 'タバコ吸いながら飲んだら引火する');