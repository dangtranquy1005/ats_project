package ATS.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(NlpClientProperties.class)
public class NlpClientConfig {
    @Bean("nlpRestClient")
    public RestClient nlpRestClient(NlpClientProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) properties.connectTimeout().toMillis());
        factory.setReadTimeout((int) properties.readTimeout().toMillis());
        return RestClient.builder().baseUrl(properties.baseUrl().toString().replaceAll("/+$", ""))
                .requestFactory(factory).build();
    }
}
