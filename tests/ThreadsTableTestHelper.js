/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool')

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-h_W1Plfpj0TY7wyT2PUPP',
    title = 'first thread',
    body = 'my first thread',
    owner = 'user-DWrT3pXe1hccYkV1eIAxX',
    username = 'vito',
    date = new Date(),
  }) {
    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, title, body, owner, username, date],
    }

    await pool.query(query)
  },

  async findThreadById(id) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [id],
    }

    const result = await pool.query(query)
    return result.rows
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1')
  },
}

module.exports = ThreadsTableTestHelper
