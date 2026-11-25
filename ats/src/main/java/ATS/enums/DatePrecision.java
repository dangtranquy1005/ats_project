package ATS.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/** Độ chính xác của ngày do NLP trả về, độc lập với ngày đại diện được lưu. */
public enum DatePrecision {
    YEAR, MONTH;

    @JsonCreator
    public static DatePrecision fromJson(String value) {
        return value == null ? null : valueOf(value.toUpperCase(Locale.ROOT));
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }
}
