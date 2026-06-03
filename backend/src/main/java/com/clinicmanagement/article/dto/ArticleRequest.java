package com.clinicmanagement.article.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArticleRequest {
    
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    @NotBlank(message = "Nội dung không được để trống")
    private String content;
    
    private String thumbnailUrl;
    
    private String status; // DRAFT, PUBLISHED, ARCHIVED
}
