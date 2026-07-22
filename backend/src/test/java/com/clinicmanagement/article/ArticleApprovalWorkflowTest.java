package com.clinicmanagement.article;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clinicmanagement.article.dto.ArticleRequest;
import com.clinicmanagement.article.dto.ArticleResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ArticleApprovalWorkflowTest {

    @Mock private ArticleRepository articleRepository;
    @Mock private UserRepository userRepository;

    private ArticleServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ArticleServiceImpl(articleRepository, userRepository);
    }

    @Test
    void newArticleAlwaysStartsAsDraftEvenWhenPublishedStatusIsRequested() {
        User doctor = user(10L, "Doctor");
        ArticleRequest request = request("Health article", "Medical content", "PUBLISHED");

        when(userRepository.findById(10L)).thenReturn(Optional.of(doctor));
        when(articleRepository.existsBySlug("health-article")).thenReturn(false);
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> {
            Article article = invocation.getArgument(0);
            article.setArticleId(100L);
            return article;
        });

        ArticleResponse response = service.createArticle(10L, request);

        assertEquals("DRAFT", response.getStatus());
    }

    @Test
    void doctorCannotEditAnotherAuthorsArticle() {
        Article article = new Article();
        article.setArticleId(101L);
        article.setCreatedBy(user(20L, "Another doctor"));
        article.setTitle("Existing article");
        article.setSlug("existing-article");
        article.setContent("Existing content");
        article.setStatus("DRAFT");
        when(articleRepository.findById(101L)).thenReturn(Optional.of(article));

        assertThrows(BusinessException.class,
                () -> service.updateArticle(101L, 10L, false, request("Updated", "Updated content", "PUBLISHED")));
        verify(articleRepository, never()).save(any(Article.class));
    }

    private static User user(Long id, String fullName) {
        User user = new User();
        user.setUserId(id);
        user.setFullName(fullName);
        user.setEmail(fullName.replace(' ', '.').toLowerCase() + "@example.com");
        return user;
    }

    private static ArticleRequest request(String title, String content, String status) {
        ArticleRequest request = new ArticleRequest();
        request.setTitle(title);
        request.setContent(content);
        request.setStatus(status);
        return request;
    }
}
