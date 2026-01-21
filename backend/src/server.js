const express = require("express");
const { createPool } = require("./db");

const app = express();
app.use(express.json());

const pool = createPool();

/**
 * ============================
 * 問題取得API（※シャッフルなし）
 * GET /api/questions?count=10
 * ============================
 */
app.get("/api/questions", async (req, res) => {
  try {
    const count = Math.min(Number(req.query.count || 10), 50);

    const [rows] = await pool.query(
      `
      SELECT
        id,
        category,
        prompt,
        option_a,
        option_b,
        option_c,
        option_d,
        answer,
        explanation
      FROM questions
      ORDER BY RAND()
      LIMIT ?
      `,
      [count]
    );

    // ★ DBの内容をそのまま返す（ランダム化しない）
    const questions = rows.map(q => ({
      id: q.id,
      category: q.category,
      prompt: q.prompt,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      answer: q.answer,
      explanation: q.explanation
    }));

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "failed to fetch questions" });
  }
});

/**
 * ============================
 * 結果保存API
 * ============================
 */
app.post("/api/results", async (req, res) => {
  const { total, correct, items } = req.body || {};

  if (
    !Number.isInteger(total) ||
    !Number.isInteger(correct) ||
    !Array.isArray(items)
  ) {
    return res.status(400).json({ message: "invalid request body" });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO results (total, correct) VALUES (?, ?)",
      [total, correct]
    );
    const resultId = result.insertId;

    for (const item of items) {
      await conn.query(
        `
        INSERT INTO result_items
          (result_id, question_id, selected, is_correct)
        VALUES (?, ?, ?, ?)
        `,
        [
          resultId,
          item.questionId,
          item.selected,
          item.isCorrect ? 1 : 0
        ]
      );
    }

    await conn.commit();
    res.json({ resultId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "failed to save result" });
  } finally {
    conn.release();
  }
});

/**
 * ============================
 * 結果一覧取得API
 * ============================
 */
app.get("/api/results", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        created_at,
        total,
        correct
      FROM results
      ORDER BY created_at DESC
    `);

    res.json({ results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "failed to fetch results" });
  }
});

/**
 * ============================
 * サーバー起動
 * ============================
 */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`osake-quiz backend running on port ${PORT}`);
});
