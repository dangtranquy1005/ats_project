package ATS.service;

import ATS.dto.PageResponse;
import ATS.repository.CVRepository;
import ATS.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;
import java.text.Normalizer;
import java.util.*;

/** Đọc ứng viên kỹ năng từ kết quả NLP đã lưu; không tự gán biến thể hay tự thêm vào điểm CV. */
@Service @RequiredArgsConstructor
public class UnknownSkillQuery {
    private final CVRepository cvs;
    private final SkillRepository skills;
    private final JsonMapper json;
    public record Item(String name, int cvCount) {}
    private String key(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFKC).strip().replaceAll("(?U)\\s+", " ").toLowerCase(Locale.ROOT);
    }
    @Transactional(readOnly = true)
    public PageResponse<Item> list(int page, int size, String query) {
        if (page < 0 || size < 1 || size > 100 || (query != null && query.length() > 255))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ lọc không hợp lệ");
        Set<String> known = new HashSet<>();
        for (var skill : skills.findDictionaryWithAliases()) {
            known.add(key(skill.getCanonicalName()));
            skill.getAliases().forEach(a -> known.add(key(a.getAliasText())));
        }
        Map<String, String> names = new HashMap<>(); Map<String, Integer> counts = new HashMap<>();
        for (String raw : cvs.findCompletedNlpSnapshots()) {
            try {
                var items = json.readTree(raw).path("unknownSkills");
                if (!items.isArray()) continue;
                Set<String> seen = new HashSet<>();
                for (var item : items) {
                    String name = item.path("raw").asText("");
                    String normalized = key(name);
                    if (normalized.isEmpty() || name.length() > 255 || known.contains(normalized) || !seen.add(normalized)) continue;
                    names.putIfAbsent(normalized, name); counts.merge(normalized, 1, Integer::sum);
                }
            } catch (tools.jackson.core.JacksonException ignored) {
                // Một snapshot cũ không đúng JSON không được làm hỏng cả màn hình quản trị.
            }
        }
        String term = key(query == null ? "" : query);
        List<Item> rows = counts.entrySet().stream().filter(e -> e.getKey().contains(term))
                .map(e -> new Item(names.get(e.getKey()), e.getValue()))
                .sorted(Comparator.comparingInt(Item::cvCount).reversed().thenComparing(Item::name)).toList();
        long offset = (long) page * size;
        return PageResponse.<Item>builder().content(rows.stream().skip(offset).limit(size).toList())
                .pageNumber(page).pageSize(size).totalElements((long) rows.size()).totalPages((rows.size()+size-1)/size)
                .isFirst(page == 0).isLast(offset + size >= rows.size()).build();
    }
}
