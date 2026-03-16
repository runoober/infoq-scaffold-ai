package cc.infoq.system.service.impl;

import cc.infoq.common.satoken.utils.LoginHelper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mockStatic;

@Tag("dev")
class SysSensitiveServiceImplTest {

    @Test
    @DisplayName("isSensitive: should return true when user is not logged in")
    void isSensitiveShouldReturnTrueWhenNotLogin() {
        SysSensitiveServiceImpl service = new SysSensitiveServiceImpl();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::isLogin).thenReturn(false);

            assertTrue(service.isSensitive(new String[]{"role"}, new String[]{"perm"}));
        }
    }
}
