CREATE TABLE IF NOT EXISTS "main"."empresas" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "nombre" VARCHAR,
  "municipio" VARCHAR,
  "provincia" VARCHAR,
  "forma_juridica" VARCHAR,
  "direccion" VARCHAR,
  "objecto_social" VARCHAR,
  "cnae" VARCHAR,
  "sic" VARCHAR
)
