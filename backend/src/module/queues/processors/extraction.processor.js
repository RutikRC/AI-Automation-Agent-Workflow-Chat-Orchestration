const { JOB_TYPES } = require("../constants/job.constants");
const { enqueueNextStage, updateProcessingStage } = require("../services/queue.service");
const logger = require("../../../utils/logger");
const AppError = require("../../../utils/AppError");

const processTextExtraction = async (job) => {
  const { documentId, traceId } = job.data;

  logger.info("Extraction processor started", {
    documentId,
    traceId,
    jobName: job.name,
  });

  if (!documentId) {
    throw new AppError("Missing documentId in job payload", 400);
  }

  await updateProcessingStage(documentId, JOB_TYPES.TEXT_EXTRACTION);

  logger.info("Extraction processor completed", {
    documentId,
    traceId,
    nextStage: JOB_TYPES.TEXT_CHUNKING,
  });

  return enqueueNextStage(job.name, job.data);
};

module.exports = {
  processTextExtraction,
};