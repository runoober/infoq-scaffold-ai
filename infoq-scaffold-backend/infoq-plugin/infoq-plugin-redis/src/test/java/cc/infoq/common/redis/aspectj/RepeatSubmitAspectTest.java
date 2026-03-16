package cc.infoq.common.redis.aspectj;

import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.redis.annotation.RepeatSubmit;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.ServletUtils;
import cc.infoq.common.utils.SpringUtils;
import cn.dev33.satoken.SaManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.validation.BindingResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class RepeatSubmitAspectTest {

    private final RepeatSubmitAspect aspect = new RepeatSubmitAspect();

    @Test
    @DisplayName("doBefore: should reject interval lower than 1 second")
    void doBeforeShouldRejectIntervalLowerThanOneSecond() throws Throwable {
        RepeatSubmit repeatSubmit = RepeatSubmitFixtures.class
            .getMethod("tooFast")
            .getAnnotation(RepeatSubmit.class);

        ServiceException ex = assertThrows(ServiceException.class,
            () -> aspect.doBefore(mock(JoinPoint.class), repeatSubmit));

        assertTrue(ex.getMessage().contains("不能小于'1'秒"));
    }

    @Test
    @DisplayName("doBefore/doAfter: should set key and clean up according to result")
    void doBeforeAndAfterShouldHandleCacheLifecycle() throws Throwable {
        prepareJsonUtilsContext();
        RepeatSubmit repeatSubmit = RepeatSubmitFixtures.class
            .getMethod("normal")
            .getAnnotation(RepeatSubmit.class);
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"payload"});
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/repeat");
        when(request.getHeader(SaManager.getConfig().getTokenName())).thenReturn("token-1");

        try (MockedStatic<ServletUtils> servletUtils = Mockito.mockStatic(ServletUtils.class);
             MockedStatic<RedisUtils> redisUtils = Mockito.mockStatic(RedisUtils.class)) {
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);
            redisUtils.when(() -> RedisUtils.setObjectIfAbsent(anyString(), eq(""), any())).thenReturn(true);
            redisUtils.when(() -> RedisUtils.deleteObject(anyString())).thenReturn(true);

            aspect.doBefore(joinPoint, repeatSubmit);
            aspect.doAfterReturning(joinPoint, repeatSubmit, ApiResult.ok());
            redisUtils.verify(() -> RedisUtils.deleteObject(anyString()), never());

            aspect.doBefore(joinPoint, repeatSubmit);
            aspect.doAfterReturning(joinPoint, repeatSubmit, ApiResult.fail("bad"));
            redisUtils.verify(() -> RedisUtils.deleteObject(anyString()));
        }
    }

    @Test
    @DisplayName("doBefore: should throw duplicate exception when key already exists")
    void doBeforeShouldThrowWhenKeyAlreadyExists() throws Throwable {
        prepareJsonUtilsContext();
        RepeatSubmit repeatSubmit = RepeatSubmitFixtures.class
            .getMethod("normal")
            .getAnnotation(RepeatSubmit.class);
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"payload"});
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/repeat");
        when(request.getHeader(SaManager.getConfig().getTokenName())).thenReturn("token-1");

        try (MockedStatic<ServletUtils> servletUtils = Mockito.mockStatic(ServletUtils.class);
             MockedStatic<RedisUtils> redisUtils = Mockito.mockStatic(RedisUtils.class)) {
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);
            redisUtils.when(() -> RedisUtils.setObjectIfAbsent(anyString(), eq(""), any())).thenReturn(false);

            ServiceException ex = assertThrows(ServiceException.class, () -> aspect.doBefore(joinPoint, repeatSubmit));
            assertTrue(ex.getMessage().contains("duplicated submit"));
        }
    }

    @Test
    @DisplayName("doAfterThrowing: should remove cache key")
    void doAfterThrowingShouldRemoveCacheKey() throws Throwable {
        prepareJsonUtilsContext();
        RepeatSubmit repeatSubmit = RepeatSubmitFixtures.class
            .getMethod("normal")
            .getAnnotation(RepeatSubmit.class);
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"payload"});
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/repeat");
        when(request.getHeader(SaManager.getConfig().getTokenName())).thenReturn("token-1");

        try (MockedStatic<ServletUtils> servletUtils = Mockito.mockStatic(ServletUtils.class);
             MockedStatic<RedisUtils> redisUtils = Mockito.mockStatic(RedisUtils.class)) {
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);
            redisUtils.when(() -> RedisUtils.setObjectIfAbsent(anyString(), eq(""), any())).thenReturn(true);
            redisUtils.when(() -> RedisUtils.deleteObject(anyString())).thenReturn(true);

            aspect.doBefore(joinPoint, repeatSubmit);
            aspect.doAfterThrowing(joinPoint, repeatSubmit, new RuntimeException("boom"));
            redisUtils.verify(() -> RedisUtils.deleteObject(anyString()));
        }
    }

    @Test
    @DisplayName("isFilterObject: should handle servlet, multipart and normal objects")
    void isFilterObjectShouldHandleCommonTypes() {
        MultipartFile file = mock(MultipartFile.class);
        assertTrue(aspect.isFilterObject(mock(HttpServletRequest.class)));
        assertTrue(aspect.isFilterObject(mock(HttpServletResponse.class)));
        assertTrue(aspect.isFilterObject(mock(BindingResult.class)));
        assertTrue(aspect.isFilterObject(file));
        assertTrue(aspect.isFilterObject(new MultipartFile[]{file}));
        assertTrue(aspect.isFilterObject(List.of(file)));
        assertTrue(aspect.isFilterObject(Map.of("f", file)));
        assertFalse(aspect.isFilterObject("plain"));
        assertFalse(aspect.isFilterObject(List.of("a", "b")));
    }

    private static void prepareJsonUtilsContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    private static class RepeatSubmitFixtures {

        @RepeatSubmit(interval = 500, timeUnit = TimeUnit.MILLISECONDS, message = "too-fast")
        public void tooFast() {
        }

        @RepeatSubmit(interval = 2, timeUnit = TimeUnit.SECONDS, message = "duplicated submit")
        public void normal() {
        }
    }
}
