const { body } = require("express-validator");

const uploadDocumentValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),
  body("metadata")
    .optional()
    .custom((value) => {
      if (!value) {
        return true;
      }

      if (typeof value === "object") {
        return true;
      }

      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error("Metadata must be valid JSON");
      }
    }),
];

const patchMetadataValidator = [
  body("metadata")
    .notEmpty()
    .withMessage("Metadata is required")
    .custom((value) => {
      if (typeof value === "object") {
        return true;
      }

      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error("Metadata must be valid JSON");
      }
    }),
];

module.exports = {
  uploadDocumentValidator,
  patchMetadataValidator,
};
