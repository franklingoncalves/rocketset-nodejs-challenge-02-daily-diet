import { execSync } from 'child_process';
import request from 'supertest';
import { app } from '../../src/app';

const USER_DATA = { name: 'John Doe', email: 'johndoe@gmail.com' };
const MEAL_DATA = {
  breakfast: {
    name: 'Breakfast',
    description: "It's a breakfast",
    isOnDiet: true,
    date: new Date(),
  },
  lunch: {
    name: 'Lunch',
    description: "It's a lunch",
    isOnDiet: true,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
  },
  dinner: {
    name: 'Dinner',
    description: "It's a dinner",
    isOnDiet: true,
    date: new Date(),
  },
  snack: {
    name: 'Snack',
    description: "It's a snack",
    isOnDiet: true,
    date: new Date('2021-01-01T15:00:00'),
  },
};

const createUser = async () => {
  const response = await request(app.server)
    .post('/users')
    .send(USER_DATA)
    .expect(201);
  return response.get('Set-Cookie');
};

const createMeal = async (cookie, mealData) => {
  await request(app.server)
    .post('/meals')
    .set('Cookie', cookie)
    .send(mealData)
    .expect(201);
};

const getMeals = async (cookie) => {
  const response = await request(app.server)
    .get('/meals')
    .set('Cookie', cookie)
    .expect(200);
  return response.body;
};

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  it('should be able to create a new meal', async () => {
    const cookie = await createUser();
    await createMeal(cookie, MEAL_DATA.breakfast);
  });

  it('should be able to list all meals from a user', async () => {
    const cookie = await createUser();
    await createMeal(cookie, MEAL_DATA.breakfast);
    await createMeal(cookie, MEAL_DATA.lunch);

    const meals = await getMeals(cookie);
    expect(meals).toHaveLength(2);
    expect(meals[0].name).toBe('Lunch');
    expect(meals[1].name).toBe('Breakfast');
  });

  it('should be able to show a single meal', async () => {
    const cookie = await createUser();
    await createMeal(cookie, MEAL_DATA.breakfast);

    const meals = await getMeals(cookie);
    const mealId = meals[0].id;

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Breakfast',
        description: "It's a breakfast",
        is_on_diet: 1,
        create_at: expect.any(Number),
      }),
    });
  });

  it('should be able to update a meal from a user', async () => {
    const cookie = await createUser();
    await createMeal(cookie, MEAL_DATA.breakfast);

    const meals = await getMeals(cookie);
    const mealId = meals[0].id;

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .send(MEAL_DATA.dinner)
      .expect(204);
  });

  it('should be able to delete a meal from a user', async () => {
    const cookie = await createUser();
    await createMeal(cookie, MEAL_DATA.breakfast);

    const meals = await getMeals(cookie);
    const mealId = meals[0].id;

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .expect(204);
  });

  it('should be able to get metrics from a user', async () => {
    const cookie = await createUser();
    await createMeal(cookie, {
      ...MEAL_DATA.breakfast,
      date: new Date('2021-01-01T08:00:00'),
    });
    await createMeal(cookie, {
      ...MEAL_DATA.lunch,
      date: new Date('2021-01-01T12:00:00'),
      isOnDiet: false,
    });
    await createMeal(cookie, MEAL_DATA.snack);
    await createMeal(cookie, {
      ...MEAL_DATA.dinner,
      date: new Date('2021-01-01T20:00:00'),
    });
    await createMeal(cookie, {
      ...MEAL_DATA.breakfast,
      date: new Date('2021-01-02T08:00:00'),
    });

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookie)
      .expect(200);

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalMealsOnDiet: 4,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 3,
    });
  });
});
