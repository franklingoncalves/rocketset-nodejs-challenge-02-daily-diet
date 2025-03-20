import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';
import { randomUUID } from 'node:crypto';
import { knex } from '../database';

const mealSchema = z.object({
  name: z.string(),
  description: z.string(),
  isOnDiet: z.boolean(),
});

async function insertMeal(mealData, userId) {
  await knex('meals').insert({
    id: randomUUID(),
    name: mealData.name,
    description: mealData.description,
    is_on_diet: mealData.isOnDiet,
    user_id: userId,
    create_at: new Date(),
    updated_at: new Date(),
  });
}

async function getMealByUser(userId) {
  return await knex('meals')
    .where({ user_id: userId })
    .orderBy('updated_at', 'desc');
}

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkSessionIdExists);

  app.post('/', async (request, reply) => {
    try {
      const mealData = mealSchema.parse(request.body);
      const userId = request.user?.id;
      await insertMeal(mealData, userId);
      return reply.status(201).send();
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  app.get('/', async (request, reply) => {
    const userId = request.user?.id;
    const meals = await getMealByUser(userId);
    console.log(userId);
    console.log(meals);
    return reply.status(201).send(meals);
  });
}
