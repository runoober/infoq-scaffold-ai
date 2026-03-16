package cc.infoq.system.domain.vo;

import lombok.Data;

/**
 * 验证码信息
 *
 * @author Pontus
 */
@Data
public class CaptchaVo {

    /**
     * 是否开启验证码
     */
    private Boolean captchaEnabled = true;

    /**
     * 唯一码
     */
    private String uuid;

    /**
     * 验证码图片
     */
    private String img;

}
