"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/users.routes.ts
var users_routes_exports = {};
__export(users_routes_exports, {
  usersRoutes: () => usersRoutes
});
module.exports = __toCommonJS(users_routes_exports);
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
async function usersRoutes(app) {
  app.post("/", async (request, reply) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  usersRoutes
});
