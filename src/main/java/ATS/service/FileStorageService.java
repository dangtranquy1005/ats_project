package ATS.service;

import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {
    
    private final MinioClient minioClient;
    private final String bucketName;
    
    public FileStorageService(
            @Value("${minio.url}") String minioUrl,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey,
            @Value("${minio.bucket-name:cv-files}") String bucketName) {
        
        this.bucketName = bucketName;
        this.minioClient = MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
        
        // Ensure bucket exists
        createBucketIfNotExists();
    }
    
    /**
     * Create bucket if it doesn't exist
     */
    private void createBucketIfNotExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build());
            
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Bucket '{}' created successfully", bucketName);
            }
        } catch (Exception e) {
            log.error("Error creating bucket", e);
            throw new FileStorageException("Failed to create bucket", e);
        }
    }
    
    /**
     * Upload file to MinIO
     * 
     * @param file MultipartFile to upload
     * @param userId User ID for organizing files
     * @param jobId Job ID for organizing files
     * @return File path in MinIO
     */
    public String uploadFile(MultipartFile file, Long userId, Long jobId) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("File is empty");
        }
        
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            
            // Generate unique filename: users/{userId}/jobs/{jobId}/{uuid}.pdf
            String fileName = String.format("users/%d/jobs/%d/%s%s",
                    userId, jobId, UUID.randomUUID(), extension);
            
            // Upload to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            
            log.info("File uploaded successfully: {}", fileName);
            return fileName;
            
        } catch (Exception e) {
            log.error("Error uploading file", e);
            throw new FileStorageException("Failed to upload file", e);
        }
    }
    
    /**
     * Get file from MinIO
     * 
     * @param filePath File path in MinIO
     * @return InputStream of the file
     */
    public InputStream getFile(String filePath) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filePath)
                            .build());
        } catch (Exception e) {
            log.error("Error getting file: {}", filePath, e);
            throw new FileStorageException("Failed to get file", e);
        }
    }
    
    /**
     * Delete file from MinIO
     * 
     * @param filePath File path in MinIO
     */
    public void deleteFile(String filePath) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filePath)
                            .build());
            log.info("File deleted successfully: {}", filePath);
        } catch (Exception e) {
            log.error("Error deleting file: {}", filePath, e);
            throw new FileStorageException("Failed to delete file", e);
        }
    }
    
    /**
     * Get presigned URL for file download (temporary URL)
     * 
     * @param filePath File path in MinIO
     * @param expirySeconds URL expiry time in seconds
     * @return Presigned URL
     */
    public String getPresignedUrl(String filePath, int expirySeconds) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(filePath)
                            .expiry(expirySeconds)
                            .build());
        } catch (Exception e) {
            log.error("Error generating presigned URL for: {}", filePath, e);
            throw new FileStorageException("Failed to generate presigned URL", e);
        }
    }
    
    /**
     * Custom exception for file storage errors
     */
    public static class FileStorageException extends RuntimeException {
        public FileStorageException(String message) {
            super(message);
        }
        
        public FileStorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
