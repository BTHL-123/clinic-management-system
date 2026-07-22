package com.clinicmanagement.article;

import com.clinicmanagement.article.dto.ArticleRequest;
import com.clinicmanagement.article.dto.ArticleResponse;
import com.clinicmanagement.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ArticleService {
    ArticleResponse createArticle(Long userId, ArticleRequest request);
    ArticleResponse updateArticle(Long articleId, Long userId, boolean isAdmin, ArticleRequest request);
    ArticleResponse getArticleById(Long articleId);
    ArticleResponse getArticleBySlug(String slug);
    PageResponse<ArticleResponse> getAllArticles(String status, Pageable pageable);
    void deleteArticle(Long articleId);
    ArticleResponse publishArticle(Long articleId);
}
