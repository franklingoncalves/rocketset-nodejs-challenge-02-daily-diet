import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';
import { randomUUID } from 'node:crypto';
import { knex } from '../database';

const paramsSchema = z.object({ mealId: z.string().uuid() });

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

async function getMealById(mealId, userId) {
  return await knex('meals').where({ id: mealId, user_id: userId }).first();
}

async function updateMeal(mealId, mealData, userId) {
  await knex('meals').where({ id: mealId, user_id: userId }).update({
    name: mealData.name,
    description: mealData.description,
    is_on_diet: mealData.isOnDiet,
    updated_at: new Date(),
  });
}

async function deleteMeal(mealId, userId) {
  await knex('meals').where({ id: mealId, user_id: userId }).delete();
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

    return reply.status(201).send(meals);
  });

  app.get('/:mealId', async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' });
    }

    return reply.send({ meal });
  });

  app.put('/:mealId', async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const mealData = mealSchema.parse(request.body);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' });
    }

    await updateMeal(mealId, mealData, userId);
    return reply.status(204).send();
  });

  app.delete('/:mealId', async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' });
    }

    await deleteMeal(mealId, userId);
    return reply.status(204).send();
  });
}
