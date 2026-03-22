package cc.infoq.admin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 启动程序
 */
@Slf4j
@SpringBootApplication(scanBasePackages = "cc.infoq")
public class SysAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(SysAdminApplication.class, args);
        log.info("infoq-scaffold-backend started successfully");
    }
}
