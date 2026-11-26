package ATS.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import java.net.URI;
import java.time.Duration;

@ConfigurationProperties(prefix = "nlp")
public record NlpClientProperties(
        @DefaultValue("http://127.0.0.1:8000") URI baseUrl,
        @DefaultValue("3s") Duration connectTimeout,
        @DefaultValue("30s") Duration readTimeout) {

    public NlpClientProperties {
        if (baseUrl == null || baseUrl.getHost() == null
                || !("http".equalsIgnoreCase(baseUrl.getScheme()) || "https".equalsIgnoreCase(baseUrl.getScheme()))) {
            throw new IllegalArgumentException("nlp.base-url phải là URL HTTP hoặc HTTPS hợp lệ");
        }
        validateTimeout(connectTimeout, "nlp.connect-timeout");
        validateTimeout(readTimeout, "nlp.read-timeout");
    }

    private static void validateTimeout(Duration duration, String property) {
        if (duration == null || duration.isNegative() || duration.isZero()
                || duration.compareTo(Duration.ofMillis(1)) < 0
                || duration.compareTo(Duration.ofMillis(Integer.MAX_VALUE)) > 0) {
            throw new IllegalArgumentException(property + " phải từ 1 ms đến " + Integer.MAX_VALUE + " ms");
        }
    }
}
