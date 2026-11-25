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
import java.util.concurrent.TimeUnit;

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
                .httpClient(new okhttp3.OkHttpClient.Builder()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(60, TimeUnit.SECONDS)
                        .writeTimeout(60, TimeUnit.SECONDS)
                        .callTimeout(120, TimeUnit.SECONDS).build())
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
        String path = newFilePath(userId, jobId);
        uploadFile(file, path);
        return path;
    }

    public String newFilePath(Long userId, Long jobId) {
        return String.format("users/%d/jobs/%d/%s.pdf", userId, jobId, UUID.randomUUID());
    }

    /** Khóa file được chọn trước để đăng ký xóa bù trước khi gửi dữ liệu ra MinIO. */
    public void uploadFile(MultipartFile file, String fileName) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("File is empty");
        }
        
        try {
            // Upload to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType("application/pdf")
                            .build());
            
            log.info("File uploaded successfully: {}", fileName);
            
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
