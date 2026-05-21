"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prismaGlobal = global;
exports.prisma = prismaGlobal.prisma || new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    prismaGlobal.prisma = exports.prisma;
}
