const { Queue, QueueScheduler } = require("bullmq");
const { QUEUE_NAME_DOCUMENT_PROCESSING } = require("../constants/queue.constants");
require("dotenv").config();

const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB || 0),
};

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

const queue = new Queue(QUEUE_NAME_DOCUMENT_PROCESSING, {
  connection: redisConnection,
  defaultJobOptions,
});

const scheduler = new QueueScheduler(QUEUE_NAME_DOCUMENT_PROCESSING, {
  connection: redisConnection,
});

module.exports = {
  queue,
  scheduler,
  redisConnection,
};
