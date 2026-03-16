package cc.infoq.common.satoken.config;

import cc.infoq.common.satoken.core.dao.PlusSaTokenDao;
import cc.infoq.common.satoken.core.service.SaPermissionImpl;
import cc.infoq.common.satoken.handler.SaTokenExceptionHandler;
import cn.dev33.satoken.jwt.StpLogicJwtForSimple;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;

@Tag("dev")
class SaTokenConfigTest {

    @Test
    @DisplayName("bean methods: should build sa-token integration beans")
    void beanMethodsShouldBuildExpectedInstances() {
        SaTokenConfig config = new SaTokenConfig();

        assertInstanceOf(StpLogicJwtForSimple.class, config.getStpLogicJwt());
        assertInstanceOf(SaPermissionImpl.class, config.stpInterface());
        assertInstanceOf(PlusSaTokenDao.class, config.saTokenDao());
        assertInstanceOf(SaTokenExceptionHandler.class, config.saTokenExceptionHandler());
    }
}
