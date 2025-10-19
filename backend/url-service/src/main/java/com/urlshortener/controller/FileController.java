package com.urlshortener.controller;

import com.urlshortener.model.UploadedFile;
import com.urlshortener.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = "*")
public class FileController {
    
    @Autowired
    private FileUploadService fileUploadService;
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) Integer expirationDays,
            @RequestParam(required = false, defaultValue = "false") boolean isPublic) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            UploadedFile uploadedFile = fileUploadService.uploadFile(
                file, userId, title, description, password, expirationDays, isPublic
            );
            
            Map<String, Object> fileData = new HashMap<>();
            fileData.put("id", uploadedFile.getId());
            fileData.put("fileCode", uploadedFile.getFileCode());
            fileData.put("fileUrl", uploadedFile.getFileUrl());
            fileData.put("originalFileName", uploadedFile.getOriginalFileName());
            fileData.put("fileType", uploadedFile.getFileType());
            fileData.put("fileSize", uploadedFile.getFileSize());
            fileData.put("title", uploadedFile.getTitle());
            fileData.put("description", uploadedFile.getDescription());
            fileData.put("uploadedAt", uploadedFile.getUploadedAt());
            fileData.put("expiresAt", uploadedFile.getExpiresAt());
            fileData.put("isPublic", uploadedFile.isPublic());
            fileData.put("requiresPassword", uploadedFile.isRequiresPassword());
            
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("data", fileData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/{fileCode}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileCode,
                                               @RequestParam(required = false) String password) {
        try {
            Optional<UploadedFile> fileOpt = fileUploadService.getFileByCode(fileCode);
            
            if (fileOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            UploadedFile file = fileOpt.get();
            
            // Check password if required
            if (file.isRequiresPassword()) {
                if (password == null || !password.equals(file.getPassword())) {
                    return ResponseEntity.status(401).build();
                }
            }
            
            Resource resource = fileUploadService.getFileContent(fileCode);
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                       "attachment; filename=\"" + file.getOriginalFileName() + "\"")
                .body(resource);
                
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{fileCode}/info")
    public ResponseEntity<Map<String, Object>> getFileInfo(@PathVariable String fileCode) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UploadedFile> fileOpt = fileUploadService.getFileByCode(fileCode);
            
            if (fileOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "File not found");
                return ResponseEntity.notFound().build();
            }
            
            UploadedFile file = fileOpt.get();
            
            Map<String, Object> fileData = new HashMap<>();
            fileData.put("id", file.getId());
            fileData.put("fileCode", file.getFileCode());
            fileData.put("originalFileName", file.getOriginalFileName());
            fileData.put("fileType", file.getFileType());
            fileData.put("fileSize", file.getFileSize());
            fileData.put("title", file.getTitle());
            fileData.put("description", file.getDescription());
            fileData.put("totalDownloads", file.getTotalDownloads());
            fileData.put("uploadedAt", file.getUploadedAt());
            fileData.put("lastAccessedAt", file.getLastAccessedAt());
            fileData.put("isPublic", file.isPublic());
            fileData.put("requiresPassword", file.isRequiresPassword());
            fileData.put("hasQrCode", file.isHasQrCode());
            
            response.put("success", true);
            response.put("data", fileData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserFiles(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<UploadedFile> files = fileUploadService.getUserFiles(userId);
            
            List<Map<String, Object>> filesData = files.stream().map(file -> {
                Map<String, Object> fileData = new HashMap<>();
                fileData.put("id", file.getId());
                fileData.put("fileCode", file.getFileCode());
                fileData.put("fileUrl", file.getFileUrl());
                fileData.put("originalFileName", file.getOriginalFileName());
                fileData.put("fileType", file.getFileType());
                fileData.put("fileSize", file.getFileSize());
                fileData.put("title", file.getTitle());
                fileData.put("description", file.getDescription());
                fileData.put("totalDownloads", file.getTotalDownloads());
                fileData.put("uploadedAt", file.getUploadedAt());
                fileData.put("lastAccessedAt", file.getLastAccessedAt());
                fileData.put("isPublic", file.isPublic());
                fileData.put("requiresPassword", file.isRequiresPassword());
                fileData.put("hasQrCode", file.isHasQrCode());
                return fileData;
            }).toList();
            
            response.put("success", true);
            response.put("count", files.size());
            response.put("data", filesData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/{fileCode}")
    public ResponseEntity<Map<String, Object>> updateFile(@PathVariable String fileCode,
                                                         @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) request.get("userId");
            
            if (userId == null) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            UploadedFile updates = new UploadedFile();
            if (request.containsKey("title")) updates.setTitle((String) request.get("title"));
            if (request.containsKey("description")) updates.setDescription((String) request.get("description"));
            if (request.containsKey("password")) updates.setPassword((String) request.get("password"));
            
            UploadedFile updated = fileUploadService.updateFile(fileCode, userId, updates);
            
            response.put("success", true);
            response.put("message", "File updated successfully");
            response.put("data", Map.of(
                "fileCode", updated.getFileCode(),
                "title", updated.getTitle(),
                "description", updated.getDescription(),
                "updatedAt", updated.getUpdatedAt()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/{fileCode}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String fileCode,
                                                         @RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            fileUploadService.deleteFile(fileCode, userId);
            
            response.put("success", true);
            response.put("message", "File deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/{fileCode}/redirect")
    public ResponseEntity<Map<String, Object>> handleFileRedirect(
            @PathVariable String fileCode,
            @RequestBody(required = false) Map<String, Object> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UploadedFile> fileOpt = fileUploadService.getFileByCode(fileCode);
            
            if (fileOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "File not found");
                return ResponseEntity.status(404).body(response);
            }
            
            UploadedFile file = fileOpt.get();
            
            // Check if file is active
            if (!file.isActive()) {
                response.put("success", false);
                response.put("message", "File is no longer active");
                return ResponseEntity.status(404).body(response);
            }
            
            // Check if file has expired
            if (file.getExpiresAt() != null && file.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "File has expired");
                return ResponseEntity.status(410).body(response);
            }
            
            // Check password protection
            if (file.isRequiresPassword()) {
                String providedPassword = request != null ? (String) request.get("password") : null;
                
                if (providedPassword == null || !providedPassword.equals(file.getPassword())) {
                    response.put("success", false);
                    response.put("message", "Password required");
                    response.put("passwordRequired", true);
                    return ResponseEntity.status(401).body(response);
                }
            }
            
            // Record download analytics (if enabled)
            // You can add analytics recording here
            
            // Return the download URL (full backend URL for actual file download)
            String backendUrl = System.getenv("BACKEND_URL");
            if (backendUrl == null) {
                backendUrl = "https://urlshortner-mrrl.onrender.com"; // fallback to production backend
            }
            
            Map<String, Object> fileData = new HashMap<>();
            fileData.put("fileUrl", backendUrl + "/api/v1/files/" + fileCode);
            fileData.put("downloadUrl", backendUrl + "/api/v1/files/" + fileCode);
            fileData.put("fileCode", file.getFileCode());
            fileData.put("originalFileName", file.getOriginalFileName());
            fileData.put("fileType", file.getFileType());
            fileData.put("fileSize", file.getFileSize());
            
            response.put("success", true);
            response.put("data", fileData);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}