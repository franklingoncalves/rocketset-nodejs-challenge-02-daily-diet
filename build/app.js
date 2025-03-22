"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
module.exports = __toCommonJS(app_exports);
var import_fastify = __toESM(require("fastify"));
var import_cookie = __toESM(require("@fastify/cookie"));

// src/routes/users.routes.ts
var import_zod2 = require("zod");

// src/database.ts
var import_knex = require("knex");

// src/env/index.ts
var import_dotenv = require("dotenv");
var import_zod = require("zod");
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)();
}
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("production"),
  DATABASE_CLIENT: import_zod.z.enum(["sqlite", "pg"]).default("sqlite"),
  DATABASE_URL: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3333)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u26A0\uFE0F Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables.");
}
var env = _env.data;

// src/database.ts
var config2 = {
  client: env.DATABASE_CLIENT,
  connection: env.DATABASE_CLIENT === "sqlite" ? { filename: env.DATABASE_URL } : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  }
};
var knex = (0, import_knex.knex)(config2);

// src/routes/users.routes.ts
var import_node_crypto = require("crypto");
var COOKIE_NAME = "sessionId";
var COOKIE_MAX_AGE = 1e3 * 60 * 60 * 24 * 7;
var createUserBodySchema = import_zod2.z.object({
  name: import_zod2.z.string(),
  email: import_zod2.z.string().email()
});
async function checkUserExists(email) {
  return await knex("users").where({ email }).first();
}
async function createUser({ id, name, email }) {
  await knex("users").insert({ id, name, email });
}
async function usersRoutes(app2) {
  app2.post("/", async (request, reply) => {
    const id = request.cookies[COOKIE_NAME] || (0, import_node_crypto.randomUUID)();
    reply.setCookie(COOKIE_NAME, id, {
      path: "/",
      maxAge: COOKIE_MAX_AGE
    });
    const { name, email } = createUserBodySchema.parse(request.body);
    const userExists = await checkUserExists(email);
    if (userExists) {
      return reply.status(400).send({ code: 400, message: "User already exists" });
    }
    try {
      await createUser({ id, name, email });
      return reply.status(201).send();
    } catch (error) {
      console.error("Error creating user:", error);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });
}

// src/routes/meals.routes.ts
var import_zod3 = require("zod");

// src/middlewares/check-session-id-exists.ts
async function checkSessionIdExists(request, reply) {
  const id = request.cookies.sessionId;
  if (!id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  const user = await knex("users").where({ id }).first();
  if (!user) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  request.user = user;
}

// src/routes/meals.routes.ts
var import_node_crypto2 = require("crypto");
var paramsSchema = import_zod3.z.object({ mealId: import_zod3.z.string().uuid() });
var mealSchema = import_zod3.z.object({
  name: import_zod3.z.string(),
  description: import_zod3.z.string(),
  isOnDiet: import_zod3.z.boolean()
});
async function insertMeal(mealData, userId) {
  await knex("meals").insert({
    id: (0, import_node_crypto2.randomUUID)(),
    name: mealData.name,
    description: mealData.description,
    is_on_diet: mealData.isOnDiet,
    user_id: userId,
    create_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  });
}
async function getMealByUser(userId) {
  return await knex("meals").where({ user_id: userId }).orderBy("updated_at", "desc");
}
async function getMealById(mealId, userId) {
  return await knex("meals").where({ id: mealId, user_id: userId }).first();
}
async function updateMeal(mealId, mealData, userId) {
  await knex("meals").where({ id: mealId, user_id: userId }).update({
    name: mealData.name,
    description: mealData.description,
    is_on_diet: mealData.isOnDiet,
    updated_at: /* @__PURE__ */ new Date()
  });
}
async function deleteMeal(mealId, userId) {
  await knex("meals").where({ id: mealId, user_id: userId }).delete();
}
async function getMealMetrics(userId) {
  const totalMealsOnDiet = await knex("meals").where({ user_id: userId, is_on_diet: true }).count("id", { as: "total" }).first();
  const totalMealsOffDiet = await knex("meals").where({ user_id: userId, is_on_diet: false }).count("id", { as: "total" }).first();
  const totalMeals = await knex("meals").where({ user_id: userId }).count("id", { as: "total" }).first();
  const meals = await knex("meals").where({ user_id: userId }).orderBy("create_at", "asc");
  let bestOnDietSequence = 0;
  let currentSequence = 0;
  for (const meal of meals) {
    if (meal.is_on_diet) {
      currentSequence++;
      if (currentSequence > bestOnDietSequence) {
        bestOnDietSequence = currentSequence;
      }
    } else {
      currentSequence = 0;
    }
  }
  return {
    totalMealsOnDiet: totalMealsOnDiet?.total,
    totalMealsOffDiet: totalMealsOffDiet?.total,
    totalMeals: totalMeals?.total,
    bestOnDietSequence
  };
}
async function mealsRoutes(app2) {
  app2.addHook("preHandler", checkSessionIdExists);
  app2.post("/", async (request, reply) => {
    try {
      const mealData = mealSchema.parse(request.body);
      const userId = request.user?.id;
      await insertMeal(mealData, userId);
      return reply.status(201).send();
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });
  app2.get("/", async (request, reply) => {
    const userId = request.user?.id;
    const meals = await getMealByUser(userId);
    return reply.status(200).send(meals);
  });
  app2.get("/:mealId", async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);
    if (!meal) {
      return reply.status(404).send({ error: "Meal not found" });
    }
    return reply.send({ meal });
  });
  app2.put("/:mealId", async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const mealData = mealSchema.parse(request.body);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);
    if (!meal) {
      return reply.status(404).send({ error: "Meal not found" });
    }
    await updateMeal(mealId, mealData, userId);
    return reply.status(204).send();
  });
  app2.delete("/:mealId", async (request, reply) => {
    const { mealId } = paramsSchema.parse(request.params);
    const userId = request.user?.id;
    const meal = await getMealById(mealId, userId);
    if (!meal) {
      return reply.status(404).send({ error: "Meal not found" });
    }
    await deleteMeal(mealId, userId);
    return reply.status(204).send();
  });
  app2.get("/metrics", async (request, reply) => {
    const userId = request.user?.id;
    const metrics = await getMealMetrics(userId);
    return reply.status(200).send(metrics);
  });
}

// src/app.ts
var app = (0, import_fastify.default)();
app.register(import_cookie.default);
app.register(usersRoutes, { prefix: "users" });
app.register(mealsRoutes, { prefix: "meals" });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
