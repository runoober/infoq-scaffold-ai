package cc.infoq.system.domain;

import cc.infoq.common.validate.DataScopeGroup;
import cc.infoq.common.validate.GrantGroup;
import cc.infoq.common.validate.ResetPwdGroup;
import cc.infoq.common.validate.StatusGroup;
import cc.infoq.common.validate.UpdateByKeyGroup;
import cc.infoq.system.domain.bo.SysClientBo;
import cc.infoq.system.domain.bo.SysConfigBo;
import cc.infoq.system.domain.bo.SysOssConfigBo;
import cc.infoq.system.domain.bo.SysRoleBo;
import cc.infoq.system.domain.bo.SysUserBo;
import cc.infoq.system.domain.bo.SysUserPasswordBo;
import cc.infoq.system.domain.entity.SysUserRole;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Tag("dev")
class ValidationGroupsTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    @DisplayName("status group: should require clientId and status for client status change")
    void statusGroupShouldRequireClientStatusFields() {
        SysClientBo bo = new SysClientBo();

        assertEquals(2, validator.validate(bo, StatusGroup.class).size());
    }

    @Test
    @DisplayName("data scope group: should require roleId and dataScope")
    void dataScopeGroupShouldRequireRoleDataScopeFields() {
        SysRoleBo bo = new SysRoleBo();

        assertEquals(2, validator.validate(bo, DataScopeGroup.class).size());
    }

    @Test
    @DisplayName("reset password group: should require userId and password")
    void resetPwdGroupShouldRequireUserIdAndPassword() {
        SysUserBo bo = new SysUserBo();

        assertEquals(2, validator.validate(bo, ResetPwdGroup.class).size());
    }

    @Test
    @DisplayName("reset password fields: should reject weak passwords on write paths")
    void writePasswordFieldsShouldRejectWeakPasswords() {
        SysUserBo resetPwdBo = new SysUserBo();
        resetPwdBo.setUserId(1L);
        resetPwdBo.setPassword("123456");

        SysUserPasswordBo profilePwdBo = new SysUserPasswordBo();
        profilePwdBo.setOldPassword("OldPass1!");
        profilePwdBo.setNewPassword("123456");

        assertEquals(2, validator.validate(resetPwdBo, ResetPwdGroup.class).size());
        assertEquals(2, validator.validate(profilePwdBo).size());
    }

    @Test
    @DisplayName("update by key group: should require configKey and configValue")
    void updateByKeyGroupShouldRequireConfigKeyAndValue() {
        SysConfigBo bo = new SysConfigBo();

        assertEquals(2, validator.validate(bo, UpdateByKeyGroup.class).size());
    }

    @Test
    @DisplayName("status group: should require ossConfigId and status")
    void statusGroupShouldRequireOssConfigStatusFields() {
        SysOssConfigBo bo = new SysOssConfigBo();

        assertEquals(2, validator.validate(bo, StatusGroup.class).size());
    }

    @Test
    @DisplayName("grant group: should require userId and roleId")
    void grantGroupShouldRequireUserRoleIds() {
        SysUserRole userRole = new SysUserRole();

        assertEquals(2, validator.validate(userRole, GrantGroup.class).size());
    }
}
