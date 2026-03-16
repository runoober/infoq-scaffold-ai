package cc.infoq.common.mybatis.handler;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.mybatis.core.domain.BaseEntity;
import cc.infoq.common.satoken.utils.LoginHelper;
import org.apache.ibatis.reflection.SystemMetaObject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mockStatic;

@Tag("dev")
class InjectionMetaObjectHandlerTest {

    private final InjectionMetaObjectHandler handler = new InjectionMetaObjectHandler();

    @Test
    @DisplayName("insertFill: should populate creator fields from current login user")
    void insertFillShouldPopulateCreatorFieldsFromLoginUser() {
        BaseEntity entity = new BaseEntity();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(99L);
        loginUser.setDeptId(8L);

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);

            handler.insertFill(SystemMetaObject.forObject(entity));
        }

        assertEquals(99L, entity.getCreateBy());
        assertEquals(99L, entity.getUpdateBy());
        assertEquals(8L, entity.getCreateDept());
        assertNotNull(entity.getCreateTime());
        assertNotNull(entity.getUpdateTime());
    }

    @Test
    @DisplayName("insertFill: should fallback to default user id when login user is unavailable")
    void insertFillShouldFallbackToDefaultUserIdWhenLoginUserMissing() {
        BaseEntity entity = new BaseEntity();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenThrow(new IllegalStateException("no session"));

            handler.insertFill(SystemMetaObject.forObject(entity));
        }

        assertEquals(-1L, entity.getCreateBy());
        assertEquals(-1L, entity.getUpdateBy());
        assertEquals(-1L, entity.getCreateDept());
    }

    @Test
    @DisplayName("insertFill: should preserve preset create fields")
    void insertFillShouldPreservePresetCreateFields() {
        BaseEntity entity = new BaseEntity();
        Date fixedTime = new Date(123456789L);
        entity.setCreateTime(fixedTime);
        entity.setCreateBy(7L);
        entity.setCreateDept(6L);

        handler.insertFill(SystemMetaObject.forObject(entity));

        assertSame(fixedTime, entity.getCreateTime());
        assertSame(fixedTime, entity.getUpdateTime());
        assertEquals(7L, entity.getCreateBy());
        assertEquals(6L, entity.getCreateDept());
        assertNull(entity.getUpdateBy());
    }

    @Test
    @DisplayName("updateFill: should use current login user id")
    void updateFillShouldUseCurrentLoginUserId() {
        BaseEntity entity = new BaseEntity();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(12L);
            handler.updateFill(SystemMetaObject.forObject(entity));
        }

        assertEquals(12L, entity.getUpdateBy());
        assertNotNull(entity.getUpdateTime());
    }

    @Test
    @DisplayName("updateFill: should fallback to default user id when login id is null")
    void updateFillShouldFallbackToDefaultWhenUserIdNull() {
        BaseEntity entity = new BaseEntity();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(null);
            handler.updateFill(SystemMetaObject.forObject(entity));
        }

        assertEquals(-1L, entity.getUpdateBy());
        assertNotNull(entity.getUpdateTime());
    }

    @Test
    @DisplayName("insertFill/updateFill: should throw service exception when meta object is invalid")
    void fillShouldThrowServiceExceptionWhenMetaObjectInvalid() {
        assertThrows(ServiceException.class, () -> handler.insertFill(null));
        assertThrows(ServiceException.class, () -> handler.updateFill(null));
    }
}

