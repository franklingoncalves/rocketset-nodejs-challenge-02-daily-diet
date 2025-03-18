import { FastifyReply, FastifyRequest } from 'fastify';
import { knex } from '../database';

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = request.cookies.sessionId;

  if (!id) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const user = await knex('users').where({ id }).first();

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  request.user = user;
}
