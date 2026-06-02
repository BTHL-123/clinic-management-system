package com.clinicmanagement.article.dto;

import com.clinicmanagement.article.Article;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ArticleResponse {
    private Long articleId;
    private String title;
    private String slug;
    private String content;
    private String thumbnailUrl;
    private String status;
    private String authorName;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArticleResponse from(Article article) {
        return ArticleResponse.builder()
                .articleId(article.getArticleId())
                .title(article.getTitle())
                .slug(article.getSlug())
                .content(article.getContent())
                .thumbnailUrl(article.getThumbnailUrl())
                .status(article.getStatus())
                .authorName(article.getCreatedBy() != null ? article.getCreatedBy().getFullName() : null)
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }
}
