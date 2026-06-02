package com.clinicmanagement.article;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    
    Page<Article> findByStatus(String status, Pageable pageable);
    
    Optional<Article> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndArticleIdNot(String slug, Long articleId);
}
