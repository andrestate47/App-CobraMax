
import { S3Client } from "@aws-sdk/client-s3"

export const getBucketConfig = () => {
  return {
    bucketName: process.env.AWS_BUCKET_NAME,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || ""
  }
}

export const createS3Client = () => {
  return new S3Client({})
}
