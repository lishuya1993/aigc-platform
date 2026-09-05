package org.dromara.system.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.dromara.common.core.domain.model.LoginBody;
import org.hibernate.validator.constraints.Length;

/**
 * 用户注册对象
 *
 * @author Lion Li
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class RegisterBody extends LoginBody {

    /**
     * 用户名
     */
    // 用户端注册时由邮箱自动填充；保留字段兼容后台已有注册请求。
    private String username;

    /**
     * 用户密码
     */
    @NotBlank(message = "{user.password.not.blank}")
    @Length(min = 5, max = 30, message = "{user.password.length.valid}")
//    @Pattern(regexp = RegexConstants.PASSWORD, message = "{user.password.format.valid}")
    private String password;

    /** 用户邮箱，用于充值到账及系统通知。 */
    @NotBlank(message = "{user.email.not.blank}")
    @Email(message = "{user.email.not.valid}")
    private String email;

    /**
     * 用户类型
     */
    private String userType;

}
