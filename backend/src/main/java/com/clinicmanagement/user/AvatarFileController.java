package com.clinicmanagement.user;

import com.clinicmanagement.common.exception.ResourceNotFoundException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/files/avatars")
@RequiredArgsConstructor
public class AvatarFileController {
    @Value("${app.upload.avatar-dir:uploads/avatars}")
    private String avatarUploadDir;

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String fileName) throws MalformedURLException {
        Path uploadPath = Path.of(avatarUploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadPath)) {
            throw new ResourceNotFoundException("Avatar not found");
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("Avatar not found");
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }
}
