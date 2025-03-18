import { app } from '../../src/app';
import { execSync } from 'child_process';
import request from 'supertest';

const resetDatabase = () => {
  execSync('npm run knex migrate:rollback --all');
  execSync('npm run knex migrate:latest');
};

describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(resetDatabase);

  it('should be able to create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'john@mail.com' })
      .expect(201);

    const cookies = response.get('Set-Cookie');

    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining('sessionId')])
    );
  });

  it('should not allow creating a user with a duplicate email', async () => {
    // Primeiro, cria um usuário
    await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'john@mail.com' })
      .expect(201);

    // Tenta criar um usuário com o mesmo e-mail
    const response = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'john@mail.com' })
      .expect(400);

    expect(response.body).toEqual({
      code: 400,
      message: 'User already exists',
    });
  });
});
