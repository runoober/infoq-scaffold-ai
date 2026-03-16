package cc.infoq.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 启动程序
 */
@SpringBootApplication(scanBasePackages = "cc.infoq")
public class SysAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(SysAdminApplication.class, args);
        System.out.println("(♥◠‿◠)ﾉﾞ  infoq-scaffold-backend 启动成功   ლ(´ڡ`ლ)ﾞ");
    }
}
