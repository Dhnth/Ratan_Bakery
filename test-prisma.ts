import { PrismaClient } from "@prisma/client";
import config from "./prisma.config";

try {
  const prisma = new PrismaClient(config);
  console.log("Success!");
} catch (e) {
  console.error(e);
}
