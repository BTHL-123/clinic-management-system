package com.clinicmanagement.article;

import com.clinicmanagement.article.dto.ArticleRequest;
import com.clinicmanagement.article.dto.ArticleResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ArticleResponse createArticle(Long userId, ArticleRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy tác giả"));

        String slug = generateSlug(request.getTitle());
        if (articleRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setSlug(slug);
        article.setContent(request.getContent());
        article.setThumbnailUrl(request.getThumbnailUrl());
        // Publication is an admin approval step. New submissions are always drafts.
        article.setStatus("DRAFT");
        article.setCreatedBy(author);

        return ArticleResponse.from(articleRepository.save(article));
    }

    @Override
    @Transactional
    public ArticleResponse updateArticle(Long articleId, Long userId, boolean isAdmin, ArticleRequest request) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bài viết"));

        boolean isAuthor = article.getCreatedBy() != null
                && article.getCreatedBy().getUserId().equals(userId);
        if (!isAdmin && !isAuthor) {
            throw new BusinessException("You can only edit your own articles");
        }

        String newSlug = generateSlug(request.getTitle());
        if (articleRepository.existsBySlugAndArticleIdNot(newSlug, articleId)) {
            newSlug = newSlug + "-" + System.currentTimeMillis();
        }

        article.setTitle(request.getTitle());
        article.setSlug(newSlug);
        article.setContent(request.getContent());
        article.setThumbnailUrl(request.getThumbnailUrl());
        return ArticleResponse.from(articleRepository.save(article));
    }

    @Override
    @Transactional(readOnly = true)
    public ArticleResponse getArticleById(Long articleId) {
        return articleRepository.findById(articleId)
                .map(ArticleResponse::from)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bài viết"));
    }

    @Override
    @Transactional(readOnly = true)
    public ArticleResponse getArticleBySlug(String slug) {
        return articleRepository.findBySlug(slug)
                .map(ArticleResponse::from)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bài viết"));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ArticleResponse> getAllArticles(String status, Pageable pageable) {
        Page<Article> articles;
        if (status != null && !status.isEmpty()) {
            articles = articleRepository.findByStatus(status, pageable);
        } else {
            articles = articleRepository.findAll(pageable);
        }
        return PageResponse.from(articles.map(ArticleResponse::from));
    }

    @Override
    @Transactional
    public void deleteArticle(Long articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new BusinessException("Không tìm thấy bài viết");
        }
        articleRepository.deleteById(articleId);
    }

    @Override
    @Transactional
    public ArticleResponse publishArticle(Long articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bài viết"));
        
        article.setStatus("PUBLISHED");
        if (article.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());
        }
        
        return ArticleResponse.from(articleRepository.save(article));
    }
    
    private String generateSlug(String input) {
        String noWhiteSpace = Pattern.compile("[\\s]").matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(noWhiteSpace, Normalizer.Form.NFD);
        String slug = Pattern.compile("[^\\w-]").matcher(normalized).replaceAll("");
        return slug.toLowerCase().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }
}
