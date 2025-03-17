import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';

const COOKIE_NAME = 'sessionId';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

const createUserBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

async function checkUserExists(email) {
  return await knex('users').where({ email }).first();
}

async function createUser({ id, name, email }) {
  await knex('users').insert({ id, name, email });
}

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const id = request.cookies[COOKIE_NAME] || randomUUID();

    reply.setCookie(COOKIE_NAME, id, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    const { name, email } = createUserBodySchema.parse(request.body);

    const userExists = await checkUserExists(email);
    if (userExists) {
      return reply
        .status(400)
        .send({ code: 400, message: 'User already exists' });
    }

    try {
      await createUser({ id, name, email });
      return reply.status(201).send();
    } catch (error) {
      console.error('Error creating user:', error);
      return reply.status(500).send({ message: 'Internal Server Error' });
    }
  });
}
