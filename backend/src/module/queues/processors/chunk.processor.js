const { JOB_TYPES } = require("../constants/job.constants");
const { enqueueNextStage, updateProcessingStage } = require("../services/queue.service");
const logger = require("../../../utils/logger");
const AppError = require("../../../utils/AppError");

const processTextChunking = async (job) => {
  const { documentId, traceId } = job.data;

  logger.info("Chunk processor started", {
    documentId,
    traceId,
    jobName: job.name,
  });

  if (!documentId) {
    throw new AppError("Missing documentId in job payload", 400);
  }

  await updateProcessingStage(documentId, JOB_TYPES.TEXT_CHUNKING);

  logger.info("Chunk processor completed", {
    documentId,
    traceId,
    nextStage: JOB_TYPES.EMBEDDING_GENERATION,
  });

  return enqueueNextStage(job.name, job.data);
};

module.exports = {
  processTextChunking,
};