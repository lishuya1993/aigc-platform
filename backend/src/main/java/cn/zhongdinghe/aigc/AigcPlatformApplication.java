package cn.zhongdinghe.aigc;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("cn.zhongdinghe.aigc.**.mapper")
public class AigcPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(AigcPlatformApplication.class, args);
    }
}
